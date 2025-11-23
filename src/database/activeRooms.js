const db = require('./db');

class ActiveRooms {
    // Get room by channel ID
    static get(channelId) {
        const stmt = db.prepare('SELECT * FROM active_rooms WHERE channel_id = ?');
        return stmt.get(channelId);
    }

    // Get all active rooms
    static getAll() {
        const stmt = db.prepare('SELECT * FROM active_rooms');
        return stmt.all();
    }

    // Create new active room
    static create(channelId, guildId, ownerId) {
        const stmt = db.prepare(`
            INSERT INTO active_rooms (channel_id, guild_id, owner_id, created_at)
            VALUES (?, ?, ?, ?)
        `);
        stmt.run(channelId, guildId, ownerId, Date.now());
    }

    // Claim a room
    static claim(channelId, ownerId) {
        const stmt = db.prepare(`
            UPDATE active_rooms
            SET owner_id = ?, claimed_at = ?
            WHERE channel_id = ?
        `);
        stmt.run(ownerId, Date.now(), channelId);
    }

    // Delete room
    static delete(channelId) {
        const stmt = db.prepare('DELETE FROM active_rooms WHERE channel_id = ?');
        stmt.run(channelId);
    }

    // Check if user owns the room
    static isOwner(channelId, userId) {
        const room = this.get(channelId);
        return room && room.owner_id === userId;
    }

    // Clean up invalid rooms (used on bot startup)
    static deleteMany(channelIds) {
        if (channelIds.length === 0) return;
        const placeholders = channelIds.map(() => '?').join(',');
        const stmt = db.prepare(`DELETE FROM active_rooms WHERE channel_id IN (${placeholders})`);
        stmt.run(...channelIds);
    }
}

module.exports = ActiveRooms;
