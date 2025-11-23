const db = require('./db');

class LlamaContext {
    // Get context for a channel (last N messages)
    static get(channelId, limit = 10) {
        const stmt = db.prepare(`
            SELECT message FROM llm_context
            WHERE channel_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        `);
        const rows = stmt.all(channelId, limit);
        return rows.reverse().map(row => row.message);
    }

    // Add message to context
    static add(channelId, message) {
        // First, add the new message
        const insertStmt = db.prepare(`
            INSERT INTO llm_context (channel_id, message, created_at)
            VALUES (?, ?, ?)
        `);
        insertStmt.run(channelId, message, Date.now());

        // Then, clean up old messages (keep only last 10)
        const deleteStmt = db.prepare(`
            DELETE FROM llm_context
            WHERE channel_id = ?
            AND id NOT IN (
                SELECT id FROM llm_context
                WHERE channel_id = ?
                ORDER BY created_at DESC
                LIMIT 10
            )
        `);
        deleteStmt.run(channelId, channelId);
    }

    // Format context for prompt
    static format(channelId) {
        const messages = this.get(channelId);
        return messages.join('\n');
    }

    // Clear context for a channel
    static clear(channelId) {
        const stmt = db.prepare('DELETE FROM llm_context WHERE channel_id = ?');
        stmt.run(channelId);
    }
}

module.exports = LlamaContext;
