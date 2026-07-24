import { getPool } from "./openSQL";

const initializedGlobalKey = Symbol.for("vanillasquared.openauth-storage.initialized");
const KEY_SEPARATOR = String.fromCharCode(0x1f);
const MAX_KEY_BYTES = 1024;

let initialized = globalThis[initializedGlobalKey];

async function initializeStorage() {
  if (!initialized) {
    initialized = (async () => {
      try {
        await getPool().query(`
          CREATE TABLE IF NOT EXISTS openauth_storage (
            storage_key VARBINARY(1024) PRIMARY KEY,
            storage_value LONGTEXT NOT NULL,
            expires_at_ms BIGINT UNSIGNED NULL
          )
        `);
      } catch (error) {
        initialized = undefined;
        globalThis[initializedGlobalKey] = undefined;
        throw error;
      }
    })();
    globalThis[initializedGlobalKey] = initialized;
  }

  await initialized;
}

function encodeKey(key) {
  const value = key.join(KEY_SEPARATOR);
  const encoded = Buffer.from(value, "utf8");

  if (encoded.length > MAX_KEY_BYTES) {
    throw new Error(`OpenAuth storage key exceeds ${MAX_KEY_BYTES} bytes.`);
  }

  return encoded;
}

function decodeKey(key) {
  return Buffer.from(key).toString("utf8").split(KEY_SEPARATOR);
}

function serializeValue(value) {
  const serialized = JSON.stringify(value);

  if (serialized === undefined) {
    throw new Error("OpenAuth storage values must be JSON serializable.");
  }

  return serialized;
}

function parseValue(value) {
  return JSON.parse(String(value));
}

export function MySQLStorage() {
  return {
    async get(key) {
      await initializeStorage();
      const [rows] = await getPool().execute(
        `SELECT storage_value
         FROM openauth_storage
         WHERE storage_key = ?
           AND (expires_at_ms IS NULL OR expires_at_ms > ?)`,
        [encodeKey(key), Date.now()]
      );

      return rows.length ? parseValue(rows[0].storage_value) : undefined;
    },

    async set(key, value, expiry) {
      await initializeStorage();
      const expiresAt = expiry?.getTime();

      if (expiresAt !== undefined && !Number.isFinite(expiresAt)) {
        throw new Error("OpenAuth storage expiry must be a valid date.");
      }

      await getPool().execute(
        `INSERT INTO openauth_storage (storage_key, storage_value, expires_at_ms)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           storage_value = VALUES(storage_value),
           expires_at_ms = VALUES(expires_at_ms)`,
        [encodeKey(key), serializeValue(value), expiresAt ?? null]
      );
    },

    async remove(key) {
      await initializeStorage();
      await getPool().execute(
        "DELETE FROM openauth_storage WHERE storage_key = ?",
        [encodeKey(key)]
      );
    },

    async *scan(prefix) {
      await initializeStorage();
      const encodedPrefix = encodeKey(prefix);
      const [rows] = await getPool().execute(
        `SELECT storage_key, storage_value
         FROM openauth_storage
         WHERE LEFT(storage_key, ?) = ?
           AND (expires_at_ms IS NULL OR expires_at_ms > ?)
         ORDER BY storage_key`,
        [encodedPrefix.length, encodedPrefix, Date.now()]
      );

      for (const row of rows) {
        yield [decodeKey(row.storage_key), parseValue(row.storage_value)];
      }
    },
  };
}
