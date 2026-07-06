import "server-only";

function hasField(input, field) {
  if (!input || !field) {
    return false;
  }

  if (typeof input.has === "function") {
    return input.has(field);
  }

  if (typeof input === "object") {
    return Object.prototype.hasOwnProperty.call(input, field);
  }

  return false;
}

export function getClientControlledFields(input, serverControlledFields) {
  return serverControlledFields.filter((field) => hasField(input, field));
}

export function validateNoClientControlledFields(input, serverControlledFields, label = "field") {
  const fields = getClientControlledFields(input, serverControlledFields);

  if (!fields.length) {
    return null;
  }

  const fieldList = fields.map((field) => `"${field}"`).join(", ");
  const plural = fields.length === 1 ? label : `${label}s`;

  return `Client-controlled ${plural} are not allowed: ${fieldList}.`;
}
