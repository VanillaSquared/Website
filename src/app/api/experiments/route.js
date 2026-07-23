import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/auth/permissions";
import { requireApiPermission } from "@/auth/userManagement";
import { clearUserExperimentOverride, getUserExperimentAssignments, setUserExperimentAssignment } from "@/experiments/assignments";
import { EXPERIMENT_DEFINITIONS, getExperimentDefinition, getPublicExperimentDefinitions, isValidExperimentTreatment } from "@/experiments/definitions";
import { resolveExperiment } from "@/experiments";
import { guardSameOriginRequest } from "@/security/requestGuards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function response(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function authorizedUser() {
  return requireApiPermission(PERMISSIONS.EXPERIMENTS);
}

export async function GET() {
  const auth = await authorizedUser();
  if (auth.error) return auth.error;

  const assignments = await getUserExperimentAssignments(auth.user.id);
  const effectiveAssignments = await Promise.all(EXPERIMENT_DEFINITIONS.map((definition) => (
    resolveExperiment(definition.id, { user: auth.user, assignments })
  )));

  return response({
    experiments: getPublicExperimentDefinitions(),
    assignments: effectiveAssignments,
  });
}

export async function PATCH(request) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;
  const auth = await authorizedUser();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const definition = getExperimentDefinition(body.experimentId);
  if (!definition) return response({ error: "Unknown experiment." }, 400);
  if (body.treatment !== null && !isValidExperimentTreatment(definition, body.treatment)) {
    return response({ error: "Unknown experiment treatment." }, 400);
  }

  if (body.treatment === null) {
    await clearUserExperimentOverride(auth.user.id, definition.id);
  } else {
    await setUserExperimentAssignment(auth.user.id, definition.id, body.treatment, "override");
  }

  const assignment = await resolveExperiment(definition.id, { user: auth.user });
  return response({ assignment });
}
