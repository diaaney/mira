const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../../constants/embeds');
const { createAnimatedThinking } = require('../../../utils/spinner');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check Mira’s latency 🏓'),

    async execute(interaction) {
        // Reply immediately to avoid timeout
        await interaction.reply({
            embeds: [embeds.thinking('Pinging...')]
        });

        const startTime = Date.now();

        // Start animation
        const animation = await createAnimatedThinking(interaction, embeds, 1500);

        // Small delay to show animation
        await new Promise(resolve => setTimeout(resolve, 1500));

        const latency = Date.now() - startTime;

        // Stop animation and update to success state
        animation.stop();
        await interaction.editReply({
            embeds: [embeds.success(`🏓 Pong! Latency is **${latency}ms**`)]
        });
    }
};
