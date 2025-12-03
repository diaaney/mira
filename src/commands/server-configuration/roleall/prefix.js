const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'roleall',
    aliases: ['ra'],
    permissions: [PermissionFlagsBits.Administrator],
    async execute(message, args) {
        if (!args[0]) {
            return message.reply({
                embeds: [{
                    color: 0xa82d43,
                    description: '❌ Usage: `roleall <@role|role_id> [--add|--remove]`'
                }]
            });
        }

        // Parse the role
        const roleArgument = args[0];
        let targetRole;

        if (roleArgument.startsWith('<@&')) {
            // Role mention
            const roleId = roleArgument.match(/\d+/)[0];
            targetRole = message.guild.roles.cache.get(roleId);
        } else if (/^\d+$/.test(roleArgument)) {
            // Role ID
            targetRole = message.guild.roles.cache.get(roleArgument);
        }

        if (!targetRole) {
            return message.reply({
                embeds: [{
                    color: 0xa82d43,
                    description: '❌ Role not found'
                }]
            });
        }

        // Determine action from flags
        let action = 'add';
        if (args.slice(1).includes('--remove')) {
            action = 'remove';
        }

        // Validar que el rol no sea superior al rol del bot
        if (targetRole.position >= message.guild.members.me.roles.highest.position) {
            return message.reply({
                embeds: [{
                    color: 0xa82d43,
                    description: '❌ The role is higher than or equal to my highest role'
                }]
            });
        }

        // Send processing message
        const processingMsg = await message.reply({
            embeds: [{
                color: 0x5b6fee,
                description: '⏳ Processing...'
            }]
        });

        let successCount = 0;
        let failCount = 0;

        const members = await message.guild.members.fetch();

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

        await processingMsg.edit({
            embeds: [{
                color: 0x7ab158,
                title: `${action === 'add' ? '✅ Role Assigned' : '✅ Role Removed'}`,
                description: `Successfully ${actionLabel} **${targetRole.name}** to members`,
                fields: [
                    { name: 'Successful', value: `${successCount}`, inline: true },
                    { name: 'Failed', value: `${failCount}`, inline: true },
                    { name: 'Total Processed', value: `${totalProcessed}`, inline: true }
                ]
            }]
        });
    }
};
