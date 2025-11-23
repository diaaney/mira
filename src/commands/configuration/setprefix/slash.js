const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../../database/guildConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setprefix')
        .setDescription('Set the command prefix for this server')
        .addStringOption(option =>
            option.setName('prefix')
                .setDescription('The new prefix (1-5 characters)')
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(5)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const newPrefix = interaction.options.getString('prefix');

        GuildConfig.setPrefix(interaction.guild.id, newPrefix);

        await interaction.reply({
            embeds: [{
                color: 0x7ab158,
                description: `✅ Prefix changed to \`${newPrefix}\``
            }],
            ephemeral: true
        });
    }
};
