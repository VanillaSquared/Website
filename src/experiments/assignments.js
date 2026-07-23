import "server-only";

import { getPool, initializeUsersTable } from "@/auth/openSQL";

let assignmentsInitialized;

async function initializeExperimentAssignmentsTable() {
  if (!assignmentsInitialized) {
    assignmentsInitialized = (async () => {
      try {
        await initializeUsersTable();
        await getPool().query(`
          CREATE TABLE IF NOT EXISTS user_experiment_assignments (
            user_id CHAR(36) NOT NULL,
            experiment_id VARCHAR(128) NOT NULL,
            treatment VARCHAR(64) NOT NULL,
            assignment_source VARCHAR(16) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, experiment_id, assignment_source),
            CONSTRAINT experiment_assignments_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
      } catch (error) {
        assignmentsInitialized = undefined;
        throw error;
      }
    })();
  }
  await assignmentsInitialized;
}

function parseAssignment(row) {
  return {
    experimentId: row.experiment_id,
    treatment: row.treatment,
    source: row.assignment_source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserExperimentAssignments(userId) {
  if (!userId) return [];
  await initializeExperimentAssignmentsTable();
  const [rows] = await getPool().execute(
    "SELECT experiment_id, treatment, assignment_source, created_at, updated_at FROM user_experiment_assignments WHERE user_id = ? ORDER BY experiment_id, assignment_source",
    [userId]
  );
  return rows.map(parseAssignment);
}

export async function setUserExperimentAssignment(userId, experimentId, treatment, source) {
  if (!userId || !["rollout", "override"].includes(source)) throw new Error("Invalid experiment assignment.");
  await initializeExperimentAssignmentsTable();
  await getPool().execute(
    `INSERT INTO user_experiment_assignments (user_id, experiment_id, treatment, assignment_source)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE treatment = VALUES(treatment)`,
    [userId, experimentId, treatment, source]
  );
}

export async function clearUserExperimentOverride(userId, experimentId) {
  await initializeExperimentAssignmentsTable();
  await getPool().execute(
    "DELETE FROM user_experiment_assignments WHERE user_id = ? AND experiment_id = ? AND assignment_source = 'override'",
    [userId, experimentId]
  );
}
