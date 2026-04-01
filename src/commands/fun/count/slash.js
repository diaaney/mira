const {
    SlashCommandBuilder,
    PermissionFlagsBits,
} = require('discord.js');
const { setCountingChannel } = require('../../../utils/storage');
const embeds = require('../../../constants/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('count')
        .setDescription('Setup counting game in current channel')
        .addSubcommand(sub =>
            sub.setName('setup')
                .setDescription('Enable counting in this channel')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channel = interaction.channel;

        // Show thinking state
        await interaction.reply({
            embeds: [embeds.thinking('Configuring counting game...')],
            ephemeral: true
        });

        // Set this channel as the counting channel
        setCountingChannel(channel.id);

        // Update to success state
        await interaction.editReply({
            embeds: [embeds.success(
                `Counting game enabled in ${channel}!\n\n` +
                `**Rules:**\n` +
                `• Count from 1, 2, 3, etc.\n` +
                `• Each user must take turns (can't count twice in a row)\n` +
                `• If someone sends the wrong number, count resets to 0\n` +
                `• ✅ = Correct | ❌ = Wrong (resets count)`
            )]
        });
    }
};
