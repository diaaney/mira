const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../../constants/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription("Check Mira's latency 🏓"),

    async execute(interaction) {
        // Show thinking state with random verb
        await interaction.reply({
            embeds: [embeds.thinking()]
        });

        // Calculate actual latency (before animation delay)
        const latency = Date.now() - interaction.createdTimestamp;
        const wsPing = interaction.client.ws.ping;

        // Calculate uptime
        const uptime = Date.now() - interaction.client.readyTimestamp;
        const hours = Math.floor(uptime / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        const uptimeFormatted = `${hours}h ${minutes}m`;

        // Animation delay (doubled to 1600ms)
        await new Promise(resolve => setTimeout(resolve, 1600));

        // Update to success state with terminal-style format
        const message = `🏓  **Ping Check**\n→ API: ${latency}ms\n→ WebSocket: ${wsPing}ms\n→ Uptime: ${uptimeFormatted}`;

        await interaction.editReply({
            embeds: [embeds.success(message)]
        });
    }
};
