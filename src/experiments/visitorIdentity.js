export const VISITOR_ID_COOKIE = "vsq_visitor_id";
export const VISITOR_ID_HEADER = "x-vsq-visitor-id";
export const VISITOR_ID_MAX_AGE = 60 * 60 * 24 * 400;
const VISITOR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidVisitorId(value) {
  return VISITOR_ID_PATTERN.test(value ?? "");
}
