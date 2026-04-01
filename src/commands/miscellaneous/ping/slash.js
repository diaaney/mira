const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../../constants/embeds');
const { createAnimatedThinking } = require('../../../utils/spinner');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check Mira’s latency 🏓'),

    async execute(interaction) {
        // Show animated thinking state
        const sent = await interaction.reply({
            embeds: [embeds.thinking('Pinging...')],
            fetchReply: true
        });

        const animation = await createAnimatedThinking(interaction, embeds, 1000);

        const latency = sent.createdTimestamp - interaction.createdTimestamp;

        // Small delay to show animation
        await new Promise(resolve => setTimeout(resolve, 200));

        // Stop animation and update to success state
        animation.stop();
        await interaction.editReply({
            embeds: [embeds.success(`🏓 Pong! Latency is **${latency}ms**`)]
        });
    }
};
