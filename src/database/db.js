const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'mira.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS guild_configs (
            guild_id TEXT PRIMARY KEY,
            prefix TEXT DEFAULT '!' NOT NULL,
            voicemaster_generator_id TEXT,
            voicemaster_category_id TEXT,
            voicemaster_panel_id TEXT,
            role_on_join_id TEXT,
            rgb_loop_roles TEXT,
            rgb_loop_interval INTEGER DEFAULT 1500,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS active_rooms (
            channel_id TEXT PRIMARY KEY,
            guild_id TEXT NOT NULL,
            owner_id TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            claimed_at INTEGER,
            FOREIGN KEY (guild_id) REFERENCES guild_configs(guild_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS llm_context (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_id TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_llm_context_channel
            ON llm_context(channel_id, created_at DESC);

        -- Tabla para guardar TODOS los mensajes del canal con embeddings
        CREATE TABLE IF NOT EXISTS channel_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            username TEXT NOT NULL,
            content TEXT NOT NULL,
            embedding TEXT,
            created_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_channel_messages_channel
            ON channel_messages(channel_id, created_at DESC);

        CREATE INDEX IF NOT EXISTS idx_channel_messages_user
            ON channel_messages(user_id);
    `);

    console.log('[Database] Schema initialized successfully');
}

// Run initialization
initDatabase();

// Run migrations
const { runMigrations } = require('./migrations');
runMigrations();

module.exports = db;
