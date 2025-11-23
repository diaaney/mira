const axios = require('axios');

async function askLlama(prompt) {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

    try {
        const res = await axios.post(`${ollamaUrl}/api/generate`, {
            model: 'llama3:latest',
            prompt,
            stream: false
        }, {
            timeout: 30000 // 30 second timeout
        });

        return res.data.response;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error(`[LLaMA] Cannot connect to Ollama at ${ollamaUrl}`);
            throw new Error('Ollama service is not available');
        }
        throw error;
    }
}

module.exports = askLlama;
