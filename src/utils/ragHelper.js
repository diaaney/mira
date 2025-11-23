const axios = require('axios');
const ChannelMessages = require('../database/channelMessages');

class RAGHelper {
    constructor() {
        this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    }

    // Generar embedding para un texto
    async generateEmbedding(text) {
        try {
            const res = await axios.post(`${this.ollamaUrl}/api/embeddings`, {
                model: 'nomic-embed-text',
                prompt: text
            }, {
                timeout: 30000
            });
            return res.data.embedding;
        } catch (error) {
            console.error('[RAG] Error generating embedding:', error.message);
            return null;
        }
    }

    // Guardar mensaje con embedding
    async saveMessageWithEmbedding(channelId, userId, username, content) {
        // Guardar mensaje inmediatamente
        ChannelMessages.save(channelId, userId, username, content, null);

        // Generar embedding en background (no bloquear)
        this.generateEmbedding(content)
            .then(embedding => {
                if (embedding) {
                    // Actualizar el mensaje con el embedding
                    const db = require('../database/db');
                    const stmt = db.prepare(`
                        UPDATE channel_messages
                        SET embedding = ?
                        WHERE channel_id = ? AND user_id = ? AND content = ?
                        AND created_at = (
                            SELECT MAX(created_at) FROM channel_messages
                            WHERE channel_id = ? AND user_id = ? AND content = ?
                        )
                    `);
                    stmt.run(JSON.stringify(embedding), channelId, userId, content, channelId, userId, content);
                }
            })
            .catch(err => console.error('[RAG] Background embedding failed:', err));
    }

    // Construir contexto usando RAG
    async buildContextWithRAG(channelId, userQuery, options = {}) {
        const {
            recentMessagesCount = 10,
            relevantMessagesCount = 5,
            maxTotalMessages = 15
        } = options;

        // 1. Obtener mensajes recientes (siempre incluir)
        const recentMessages = ChannelMessages.getRecent(channelId, recentMessagesCount);

        // 2. Buscar mensajes relevantes usando embeddings
        let relevantMessages = [];
        const queryEmbedding = await this.generateEmbedding(userQuery);

        if (queryEmbedding) {
            relevantMessages = ChannelMessages.searchSimilar(
                channelId,
                queryEmbedding,
                relevantMessagesCount
            );
        }

        // 3. Combinar y deduplicar mensajes
        const recentIds = new Set(recentMessages.map(m => m.id));
        const uniqueRelevant = relevantMessages.filter(m => !recentIds.has(m.id));

        // 4. Limitar total de mensajes
        const allMessages = [...recentMessages, ...uniqueRelevant].slice(0, maxTotalMessages);

        // 5. Ordenar por timestamp
        allMessages.sort((a, b) => a.created_at - b.created_at);

        return {
            messages: allMessages,
            formattedContext: ChannelMessages.formatForContext(allMessages),
            stats: {
                totalInChannel: ChannelMessages.countByChannel(channelId),
                recentUsed: recentMessages.length,
                relevantUsed: uniqueRelevant.length,
                totalUsed: allMessages.length
            }
        };
    }

    // Generar respuesta con LLaMA usando RAG y chat API
    async generateResponse(channelId, userQuery, systemPrompt) {
        try {
            // Construir contexto con RAG
            const { messages: contextMessages, stats } = await this.buildContextWithRAG(channelId, userQuery);

            console.log(`[RAG] Using ${stats.totalUsed} messages (${stats.recentUsed} recent + ${stats.relevantUsed} relevant) from ${stats.totalInChannel} total`);

            // Construir mensajes para el chat API
            const chatMessages = [
                {
                    role: 'system',
                    content: systemPrompt
                }
            ];

            // Agregar contexto histórico como mensajes del chat
            for (const msg of contextMessages) {
                chatMessages.push({
                    role: msg.user_id === 'bot' ? 'assistant' : 'user',
                    content: `${msg.username}: ${msg.content}`
                });
            }

            // Agregar consulta actual del usuario
            chatMessages.push({
                role: 'user',
                content: userQuery
            });

            // Generar respuesta usando chat API
            const res = await axios.post(`${this.ollamaUrl}/api/chat`, {
                model: 'llama3.2:3b',
                messages: chatMessages,
                stream: false
            }, {
                timeout: 60000
            });

            return res.data.message.content;
        } catch (error) {
            console.error('[RAG] Error generating response:', error.message);
            throw error;
        }
    }
}

module.exports = new RAGHelper();
