import "server-only";

import { getPool, initializeUsersTable } from "@/auth/openSQL";

let preferencesInitialized;

async function initializeUserPreferencesTable() {
  if (!preferencesInitialized) {
    preferencesInitialized = (async () => {
      try {
        await initializeUsersTable();
        await getPool().query(`
          CREATE TABLE IF NOT EXISTS user_preferences (
            user_id CHAR(36) PRIMARY KEY,
            developer_mode BOOLEAN NOT NULL DEFAULT FALSE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT user_preferences_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
      } catch (error) {
        preferencesInitialized = undefined;
        throw error;
      }
    })();
  }
  await preferencesInitialized;
}

export async function getUserPreferences(userId) {
  await initializeUserPreferencesTable();
  const [rows] = await getPool().execute("SELECT developer_mode FROM user_preferences WHERE user_id = ? LIMIT 1", [userId]);
  return { developerMode: Boolean(rows[0]?.developer_mode) };
}

export async function updateUserPreferences(userId, { developerMode }) {
  if (typeof developerMode !== "boolean") {
    const error = new Error("Choose a valid developer mode setting.");
    error.status = 400;
    throw error;
  }
  await initializeUserPreferencesTable();
  await getPool().execute(
    `INSERT INTO user_preferences (user_id, developer_mode) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE developer_mode = VALUES(developer_mode)`,
    [userId, developerMode]
  );
  return { developerMode };
}
