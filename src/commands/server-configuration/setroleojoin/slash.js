const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../../database/guildConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setroleojoin')
        .setDescription('Set the role to automatically assign to new members')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to assign on join (or null to disable)')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const role = interaction.options.getRole('role');

        GuildConfig.setRoleOnJoin(interaction.guild.id, role.id);

        await interaction.reply({
            embeds: [{
                color: 0x7ab158,
                description: `✅ New members will now automatically receive the **${role.name}** role on join`
            }],
            ephemeral: true
        });
    }
};
