const db = require('./db');

module.exports = {
    // Agregar usuario al whitelist
    add: (discordId, minecraftName, discordUsername, addedBy) => {
        const now = Date.now();
        try {
            const stmt = db.prepare(`
                INSERT INTO smp_whitelist (discord_id, minecraft_name, discord_username, added_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            return stmt.run(discordId, minecraftName, discordUsername, addedBy, now, now);
        } catch (error) {
            throw error;
        }
    },

    // Obtener usuario por Discord ID
    getByDiscordId: (discordId) => {
        const stmt = db.prepare('SELECT * FROM smp_whitelist WHERE discord_id = ?');
        return stmt.get(discordId);
    },

    // Obtener usuario por nombre de Minecraft
    getByMinecraftName: (minecraftName) => {
        const stmt = db.prepare('SELECT * FROM smp_whitelist WHERE minecraft_name = ?');
        return stmt.get(minecraftName);
    },

    // Obtener todos los usuarios
    getAll: () => {
        const stmt = db.prepare('SELECT * FROM smp_whitelist ORDER BY created_at DESC');
        return stmt.all();
    },

    // Verificar si existe un usuario
    exists: (discordId) => {
        const stmt = db.prepare('SELECT 1 FROM smp_whitelist WHERE discord_id = ?');
        return stmt.get(discordId) !== undefined;
    },

    // Eliminar usuario del whitelist
    remove: (discordId) => {
        const stmt = db.prepare('DELETE FROM smp_whitelist WHERE discord_id = ?');
        return stmt.run(discordId);
    },

    // Actualizar nombre de Minecraft
    updateMinecraftName: (discordId, newMinecraftName) => {
        const now = Date.now();
        const stmt = db.prepare(`
            UPDATE smp_whitelist
            SET minecraft_name = ?, updated_at = ?
            WHERE discord_id = ?
        `);
        return stmt.run(newMinecraftName, now, discordId);
    },

    // Contar total de usuarios
    count: () => {
        const stmt = db.prepare('SELECT COUNT(*) as total FROM smp_whitelist');
        return stmt.get().total;
    }
};
