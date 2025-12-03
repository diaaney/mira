const db = require('./db');

function runMigrations() {
    console.log('[Migrations] Checking for database migrations...');

    // Agregar columnas RGB si no existen
    try {
        const tableInfo = db.prepare("PRAGMA table_info(guild_configs)").all();
        const columnNames = tableInfo.map(col => col.name);

        if (!columnNames.includes('rgb_loop_roles')) {
            console.log('[Migrations] Adding rgb_loop_roles column...');
            db.exec('ALTER TABLE guild_configs ADD COLUMN rgb_loop_roles TEXT;');
        }

        if (!columnNames.includes('rgb_loop_interval')) {
            console.log('[Migrations] Adding rgb_loop_interval column...');
            db.exec('ALTER TABLE guild_configs ADD COLUMN rgb_loop_interval INTEGER DEFAULT 1500;');
        }

        console.log('[Migrations] Database is up to date');
    } catch (error) {
        console.error('[Migrations] Error:', error.message);
    }
}

module.exports = { runMigrations };
