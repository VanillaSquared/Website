import "server-only";

import { getUserRolesByUserId } from "@/auth/openSQL";
import { getUserExperimentAssignments, setUserExperimentAssignment } from "@/experiments/assignments";
import { EXPERIMENT_DEFINITIONS, getExperimentDefinition, isValidExperimentTreatment } from "@/experiments/definitions";
import { meetsExperimentRequirements, resolveRolloutTreatment } from "@/experiments/resolution";
import { getVisitorId } from "@/experiments/visitor";

function findValidAssignment(assignments, definition, source) {
  const assignment = assignments.find((item) => item.experimentId === definition.id && item.source === source);
  return assignment && isValidExperimentTreatment(definition, assignment.treatment) ? assignment : null;
}

export async function resolveExperiment(experimentId, { user = null, visitorId, roles, assignments } = {}) {
  const definition = getExperimentDefinition(experimentId);
  if (!definition) return { experimentId, treatment: "disabled", source: "rollout" };

  const signedIn = Boolean(user?.id);
  const resolvedRoles = roles ?? (signedIn ? await getUserRolesByUserId(user.id) : []);
  const resolvedAssignments = assignments ?? (signedIn ? await getUserExperimentAssignments(user.id) : []);
  const override = signedIn ? findValidAssignment(resolvedAssignments, definition, "override") : null;
  if (override) return { experimentId, treatment: override.treatment, source: "override" };

  if (!meetsExperimentRequirements(definition.requirements, { signedIn, roles: resolvedRoles })) {
    return { experimentId, treatment: "disabled", source: "rollout" };
  }

  const savedRollout = signedIn ? findValidAssignment(resolvedAssignments, definition, "rollout") : null;
  if (savedRollout) return { experimentId, treatment: savedRollout.treatment, source: "rollout" };

  const identityId = signedIn ? user.id : (visitorId ?? await getVisitorId());
  const treatment = resolveRolloutTreatment(definition, identityId);
  if (signedIn) await setUserExperimentAssignment(user.id, experimentId, treatment, "rollout");
  return { experimentId, treatment, source: "rollout" };
}

export async function getExperimentTreatment(experimentId, context) {
  return (await resolveExperiment(experimentId, context)).treatment;
}

export async function hasExperimentTreatment(experimentId, treatment, context) {
  return await getExperimentTreatment(experimentId, context) === treatment;
}

export async function getEffectiveExperimentTreatments(user = null) {
  const [visitorId, roles, assignments] = await Promise.all([
    user?.id ? Promise.resolve(null) : getVisitorId(),
    user?.id ? getUserRolesByUserId(user.id) : Promise.resolve([]),
    user?.id ? getUserExperimentAssignments(user.id) : Promise.resolve([]),
  ]);
  const results = await Promise.all(EXPERIMENT_DEFINITIONS.map((definition) => (
    resolveExperiment(definition.id, { user, visitorId, roles, assignments })
  )));
  return Object.fromEntries(results.map((result) => [result.experimentId, result.treatment]));
}
