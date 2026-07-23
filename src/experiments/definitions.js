const EXPERIMENT_ID_PATTERN = /^\d{4}-\d{2}-[a-z0-9][a-z0-9_-]{0,95}$/;
const TREATMENT_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

const rawDefinitions = [
  {
    id: "2026-07-test_experiment",
    treatments: [
      { id: "variant_1", percentage: 75 },
    ],
    requirements: {
      signedIn: true
    },
  },
];

function validateDefinition(definition, experimentIds) {
  if (!definition || !EXPERIMENT_ID_PATTERN.test(definition.id ?? "")) {
    throw new Error(`Invalid experiment ID: ${definition?.id ?? "(missing)"}`);
  }
  if (experimentIds.has(definition.id)) throw new Error(`Duplicate experiment ID: ${definition.id}`);
  experimentIds.add(definition.id);

  if (!Array.isArray(definition.treatments) || !definition.treatments.length) {
    throw new Error(`Experiment ${definition.id} must define at least one treatment.`);
  }

  const treatmentIds = new Set();
  let total = 0;
  for (const treatment of definition.treatments) {
    if (!TREATMENT_ID_PATTERN.test(treatment?.id ?? "") || treatment.id === "disabled") {
      throw new Error(`Invalid treatment ID in experiment ${definition.id}.`);
    }
    if (treatmentIds.has(treatment.id)) throw new Error(`Duplicate treatment ${treatment.id} in experiment ${definition.id}.`);
    if (typeof treatment.percentage !== "number" || !Number.isFinite(treatment.percentage) || treatment.percentage < 0 || treatment.percentage > 100) {
      throw new Error(`Invalid rollout percentage for ${definition.id}/${treatment.id}.`);
    }
    treatmentIds.add(treatment.id);
    total += treatment.percentage;
  }
  if (total > 100 + Number.EPSILON) throw new Error(`Experiment ${definition.id} rollout exceeds 100%.`);

  const requirements = definition.requirements;
  if (requirements !== undefined) {
    const keys = Object.keys(requirements);
    if (keys.some((key) => !["signedIn", "role"].includes(key))) throw new Error(`Invalid requirements for experiment ${definition.id}.`);
    if (requirements.signedIn !== undefined && typeof requirements.signedIn !== "boolean") throw new Error(`Invalid signed-in requirement for experiment ${definition.id}.`);
    if (requirements.role !== undefined && (typeof requirements.role !== "string" || !TREATMENT_ID_PATTERN.test(requirements.role))) {
      throw new Error(`Invalid role requirement for experiment ${definition.id}.`);
    }
  }
}

export function validateExperimentDefinitions(definitions) {
  if (!Array.isArray(definitions)) throw new Error("Experiment definitions must be an array.");
  const experimentIds = new Set();
  definitions.forEach((definition) => validateDefinition(definition, experimentIds));
  return definitions;
}

validateExperimentDefinitions(rawDefinitions);

export const EXPERIMENT_DEFINITIONS = Object.freeze(rawDefinitions.map((definition) => Object.freeze({
  ...definition,
  treatments: Object.freeze(definition.treatments.map((treatment) => Object.freeze({ ...treatment }))),
  requirements: definition.requirements ? Object.freeze({ ...definition.requirements }) : undefined,
})));

const experimentsById = new Map(EXPERIMENT_DEFINITIONS.map((definition) => [definition.id, definition]));

export function getExperimentDefinition(experimentId) {
  return experimentsById.get(experimentId) ?? null;
}

export function isValidExperimentTreatment(definition, treatment) {
  return treatment === "disabled" || Boolean(definition?.treatments.some((item) => item.id === treatment));
}

export function getPublicExperimentDefinitions() {
  return EXPERIMENT_DEFINITIONS.map(({ id, treatments }) => ({
    id,
    treatments: treatments.map((treatment) => ({ ...treatment })),
    rolloutPercentage: treatments.reduce((sum, treatment) => sum + treatment.percentage, 0),
  }));
}
