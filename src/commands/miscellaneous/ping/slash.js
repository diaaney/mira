const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../../constants/embeds');
const { createAnimatedThinking } = require('../../../utils/spinner');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check Mira’s latency 🏓'),

    async execute(interaction) {
        const startTime = Date.now();

        // Reply with first verb immediately to avoid timeout
        await interaction.reply({
            embeds: [embeds.thinking('Loading...')]
        });

        // Start animation
        const animation = await createAnimatedThinking(interaction, embeds, 2400);

        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 2400));

        const latency = Date.now() - startTime;

        // Stop animation and update to success state
        animation.stop();
        await interaction.editReply({
            embeds: [embeds.success(`🏓 Pong! Latency is **${latency}ms**`)]
        });
    }
};
