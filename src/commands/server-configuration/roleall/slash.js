const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleall')
        .setDescription('Assign or remove a role from all members')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to assign or remove')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Whether to add or remove the role')
                .setRequired(false)
                .addChoices(
                    { name: 'Add', value: 'add' },
                    { name: 'Remove', value: 'remove' }
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const targetRole = interaction.options.getRole('role');
        const action = interaction.options.getString('action') || 'add';

        // Validar que el rol no sea superior al rol del bot
        if (targetRole.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                embeds: [{
                    color: 0xa82d43,
                    description: '❌ The role is higher than or equal to my highest role'
                }],
                ephemeral: true
            });
        }

        // Deferrer la respuesta porque esto puede tomar tiempo
        await interaction.deferReply();

        let successCount = 0;
        let failCount = 0;

        const members = await interaction.guild.members.fetch();

        for (const member of members.values()) {
            try {
                if (action === 'add') {
                    await member.roles.add(targetRole);
                } else {
                    await member.roles.remove(targetRole);
                }
                successCount++;
            } catch (error) {
                failCount++;
            }
        }

        const actionLabel = action === 'add' ? 'assigned' : 'removed';
        const totalProcessed = successCount + failCount;

        await interaction.editReply({
            embeds: [{
                color: 0x7ab158,
                title: `${action === 'add' ? '✅ Role Assigned' : '✅ Role Removed'}`,
                description: `Successfully ${actionLabel} **${targetRole.name}** to members`,
                fields: [
                    { name: 'Successful', value: `${successCount}`, inline: true },
                    { name: 'Failed', value: `${failCount}`, inline: true },
                    { name: 'Total Processed', value: `${totalProcessed}`, inline: true }
                ]
            }],
            ephemeral: true
        });
    }
};
