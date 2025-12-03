const { PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../../database/guildConfig');

module.exports = {
    name: 'setroleojoin',
    aliases: ['sroj'],
    permissions: [PermissionFlagsBits.Administrator],
    async execute(message, args) {
        if (!args[0]) {
            return message.reply({
                embeds: [{
                    color: 0xa82d43,
                    description: '❌ Usage: `setroleojoin <@role|role_id>`'
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

        GuildConfig.setRoleOnJoin(message.guild.id, targetRole.id);

        message.reply({
            embeds: [{
                color: 0x7ab158,
                description: `✅ New members will now automatically receive the **${targetRole.name}** role on join`
            }]
        });
    }
};
