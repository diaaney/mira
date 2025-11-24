const axios = require('axios');

/**
 * Helper para interactuar con el servidor de Minecraft
 * PLACEHOLDER: Configurar con la URL real del servidor y endpoint del plugin
 */

const MINECRAFT_API_URL = process.env.MINECRAFT_API_URL || 'http://localhost:8080'; // Placeholder
const MINECRAFT_API_KEY = process.env.MINECRAFT_API_KEY || ''; // Placeholder

module.exports = {
    /**
     * Obtener lista de jugadores conectados
     * @returns {Promise<Array>} Lista de jugadores
     */
    getConnectedPlayers: async () => {
        try {
            // PLACEHOLDER: Reemplazar con endpoint real del plugin
            const response = await axios.get(`${MINECRAFT_API_URL}/api/players/online`, {
                headers: {
                    'Authorization': `Bearer ${MINECRAFT_API_KEY}`
                }
            });

            return response.data.players || [];
        } catch (error) {
            console.error('[SMPHelper] Error getting connected players:', error.message);
            throw error;
        }
    },

    /**
     * Obtener información del servidor
     * @returns {Promise<Object>} Info del servidor (slots, jugadores, etc)
     */
    getServerInfo: async () => {
        try {
            // PLACEHOLDER: Reemplazar con endpoint real del plugin
            const response = await axios.get(`${MINECRAFT_API_URL}/api/server/info`, {
                headers: {
                    'Authorization': `Bearer ${MINECRAFT_API_KEY}`
                }
            });

            return response.data;
        } catch (error) {
            console.error('[SMPHelper] Error getting server info:', error.message);
            throw error;
        }
    },

    /**
     * Agregar usuario al whitelist del servidor
     * @param {string} playerName - Nombre del jugador
     * @param {string} uuid - UUID del jugador (optional)
     * @returns {Promise<Object>} Resultado de la operación
     */
    addToWhitelist: async (playerName, uuid = null) => {
        try {
            // PLACEHOLDER: Reemplazar con endpoint real del plugin
            const response = await axios.post(
                `${MINECRAFT_API_URL}/api/whitelist/add`,
                {
                    player_name: playerName,
                    uuid: uuid
                },
                {
                    headers: {
                        'Authorization': `Bearer ${MINECRAFT_API_KEY}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('[SMPHelper] Error adding to whitelist:', error.message);
            throw error;
        }
    },

    /**
     * Remover usuario del whitelist del servidor
     * @param {string} playerName - Nombre del jugador
     * @returns {Promise<Object>} Resultado de la operación
     */
    removeFromWhitelist: async (playerName) => {
        try {
            // PLACEHOLDER: Reemplazar con endpoint real del plugin
            const response = await axios.post(
                `${MINECRAFT_API_URL}/api/whitelist/remove`,
                {
                    player_name: playerName
                },
                {
                    headers: {
                        'Authorization': `Bearer ${MINECRAFT_API_KEY}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('[SMPHelper] Error removing from whitelist:', error.message);
            throw error;
        }
    },

    /**
     * Obtener lista completa del whitelist
     * @returns {Promise<Array>} Lista de jugadores en whitelist
     */
    getWhitelist: async () => {
        try {
            // PLACEHOLDER: Reemplazar con endpoint real del plugin
            const response = await axios.get(`${MINECRAFT_API_URL}/api/whitelist`, {
                headers: {
                    'Authorization': `Bearer ${MINECRAFT_API_KEY}`
                }
            });

            return response.data.players || [];
        } catch (error) {
            console.error('[SMPHelper] Error getting whitelist:', error.message);
            throw error;
        }
    }
};
