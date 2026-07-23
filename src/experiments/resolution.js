// FNV-1a provides a small, stable unsigned 32-bit hash across runtimes.
export function stableExperimentHash(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function getExperimentBucket(experimentId, identityId) {
  if (!experimentId || !identityId) return null;
  return (stableExperimentHash(`${experimentId}:${identityId}`) / 0x100000000) * 100;
}

export function meetsExperimentRequirements(requirements, { signedIn = false, roles = [] } = {}) {
  if (!requirements) return true;
  if (requirements.signedIn === true && !signedIn) return false;
  if (requirements.signedIn === false && signedIn) return false;
  if (requirements.role && (!signedIn || !roles.includes(requirements.role))) return false;
  return true;
}

export function resolveRolloutTreatment(definition, identityId) {
  const bucket = getExperimentBucket(definition?.id, identityId);
  if (bucket === null) return "disabled";

  let upperBoundary = 0;
  for (const treatment of definition.treatments) {
    upperBoundary += treatment.percentage;
    if (bucket < upperBoundary) return treatment.id;
  }
  return "disabled";
}
