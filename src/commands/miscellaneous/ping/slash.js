const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../../constants/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check Mira’s latency 🏓'),

    async execute(interaction) {
        // Show thinking state
        const sent = await interaction.reply({
            embeds: [embeds.thinking('Pinging...')],
            fetchReply: true
        });

        const latency = sent.createdTimestamp - interaction.createdTimestamp;

        // Update to success state
        await interaction.editReply({
            embeds: [embeds.success(`🏓 Pong! Latency is **${latency}ms**`)]
        });
    }
};
