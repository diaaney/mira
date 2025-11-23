const askLlama = require('../utils/askLlama');
const ctx = require('../commands/miscellaneous/ai/llamaContext');
const GuildConfig = require('../database/guildConfig');
const ragHelper = require('../utils/ragHelper');

module.exports = (client) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        // 📝 GUARDAR TODOS LOS MENSAJES en la DB para RAG (en background)
        if (message.guild && message.content && message.content.length > 0) {
            ragHelper.saveMessageWithEmbedding(
                message.channel.id,
                message.author.id,
                message.author.username,
                message.content
            ).catch(err => console.error('[RAG] Save failed:', err));
        }

        // --- 🔹 RESPUESTAS .LLAMA CON RAG ---
        if (message.content.startsWith('.')) {
            const userInput = message.content.slice(1).trim();
            const channelId = message.channel.id;

            const systemPrompt = `Eres una chica llamada Mira, tierna pero sarcástica, y estás chateando en Discord con un grupo de humanos. Sé divertida y útil.`;

            try {
                // Usar RAG para obtener contexto relevante de TODO el historial
                const reply = await ragHelper.generateResponse(channelId, userInput, systemPrompt);
                await message.reply(reply.slice(0, 2000));
            } catch (err) {
                console.error('[LLaMA error]', err);
                await message.reply('❌ No pude responder eso ahora.');
            }

            return; // evita que también intente ejecutarlo como comando prefix
        }

        // --- 🔹 COMANDOS PREFIX ---
        // Get guild-specific prefix (defaults to '!')
        const prefix = message.guild
            ? GuildConfig.getPrefix(message.guild.id)
            : '!';

        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();

        const command = client.prefixCommands.get(cmd);
        if (!command) return;

        try {
            await command.execute(message, args);
        } catch (error) {
            console.error(error);
            await message.reply('❌ Error executing command');
        }
    });
};
