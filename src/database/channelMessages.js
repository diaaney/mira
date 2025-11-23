const db = require('./db');

class ChannelMessages {
    // Guardar mensaje con embedding
    static save(channelId, userId, username, content, embedding = null) {
        const stmt = db.prepare(`
            INSERT INTO channel_messages (channel_id, user_id, username, content, embedding, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const embeddingJson = embedding ? JSON.stringify(embedding) : null;
        stmt.run(channelId, userId, username, content, embeddingJson, Date.now());
    }

    // Obtener todos los mensajes de un canal
    static getAllByChannel(channelId, limit = null) {
        let query = 'SELECT * FROM channel_messages WHERE channel_id = ? ORDER BY created_at DESC';
        if (limit) {
            query += ` LIMIT ${limit}`;
        }
        const stmt = db.prepare(query);
        return stmt.all(channelId);
    }

    // Obtener mensajes recientes para contexto
    static getRecent(channelId, limit = 20) {
        const stmt = db.prepare(`
            SELECT * FROM channel_messages
            WHERE channel_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        `);
        return stmt.all(channelId, limit).reverse();
    }

    // Buscar mensajes similares usando embeddings (similarity search simple)
    static searchSimilar(channelId, queryEmbedding, limit = 5) {
        // Obtener todos los mensajes con embeddings del canal
        const stmt = db.prepare(`
            SELECT * FROM channel_messages
            WHERE channel_id = ? AND embedding IS NOT NULL
            ORDER BY created_at DESC
        `);
        const messages = stmt.all(channelId);

        if (messages.length === 0) return [];

        // Calcular similitud coseno
        const similarities = messages.map(msg => {
            const embedding = JSON.parse(msg.embedding);
            const similarity = this.cosineSimilarity(queryEmbedding, embedding);
            return { ...msg, similarity };
        });

        // Ordenar por similitud y devolver top N
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }

    // Calcular similitud coseno entre dos vectores
    static cosineSimilarity(a, b) {
        if (!a || !b || a.length !== b.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    // Contar mensajes por canal
    static countByChannel(channelId) {
        const stmt = db.prepare('SELECT COUNT(*) as count FROM channel_messages WHERE channel_id = ?');
        return stmt.get(channelId).count;
    }

    // Formatear mensajes para contexto
    static formatForContext(messages) {
        return messages.map(msg => `${msg.username}: ${msg.content}`).join('\n');
    }
}

module.exports = ChannelMessages;
