const { PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../../database/guildConfig');
const rgbColorLoop = require('../../../utils/rgbColorLoop');

module.exports = {
    name: 'colorrgb',
    aliases: ['rgb'],
    permissions: [PermissionFlagsBits.Administrator],
    async execute(message, args) {
        // Validar permisos del bot
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply({
                embeds: [{
                    color: 0xa82d43,
                    description: '❌ I need **Manage Roles** permission'
                }]
            });
        }

        const action = args[args.length - 1]?.toLowerCase() || 'start';
        let validActions = false;

        if (['start', 'stop', 'status'].includes(action)) {
            validActions = true;
        }

        if (action === 'status') {
            return handleStatusCommand(message);
        }

        if (action === 'stop') {
            return handleStopCommand(message);
        }

        // action === 'start' o sin action especificada
        const roleArgs = validActions ? args.slice(0, -1) : args;

        if (roleArgs.length === 0) {
            return message.reply({
                embeds: [{
                    color: 0xa82d43,
                    description: '❌ Usage: `!colorrgb <@role1> <@role2> [role3] [role4] [role5] [start|stop|status]`'
                }]
            });
        }

        return handleStartCommand(message, roleArgs);
    }
};

async function handleStartCommand(message, roleArgs) {
    const roleIds = [];

    // Parsear roles mencionados
    for (const arg of roleArgs) {
        const roleId = arg.match(/<@&(\d+)>/)?.[1];
        const role = roleId ? message.guild.roles.cache.get(roleId) : null;

        if (role) {
            roleIds.push(role.id);
        }
    }

    // Validar cantidad mínima
    if (roleIds.length < 2) {
        return message.reply({
            embeds: [{
                color: 0xa82d43,
                description: '❌ You need at least 2 roles for RGB rotation'
            }]
        });
    }

    // Validar cantidad máxima
    if (roleIds.length > 5) {
        return message.reply({
            embeds: [{
                color: 0xa82d43,
                description: '❌ Maximum 5 roles allowed'
            }]
        });
    }

    // Validar roles
    try {
        rgbColorLoop.validateRoles(message.guild, roleIds);
    } catch (error) {
        return message.reply({
            embeds: [{
                color: 0xa82d43,
                description: `❌ ${error.message}`
            }]
        });
    }

    // Detener loop anterior si existe
    if (rgbColorLoop.activeLoops.has(message.guild.id)) {
        rgbColorLoop.stopRGBLoop(message.guild.id);
    }

    // Guardar config en BD
    GuildConfig.setRGBLoopRoles(message.guild.id, roleIds);

    // Iniciar loop
    try {
        await rgbColorLoop.startRGBLoop(message.guild, roleIds, 1500);

        const roleNames = roleIds
            .map(id => message.guild.roles.cache.get(id)?.name)
            .filter(Boolean)
            .join(' → ');

        return message.reply({
            embeds: [{
                color: 0x7ab158,
                title: '✅ RGB Loop Started',
                description: `Rotating through: **${roleNames}**`,
                fields: [
                    { name: 'Interval', value: '1.5 seconds', inline: true },
                    { name: 'Total Roles', value: `${roleIds.length}`, inline: true }
                ]
            }]
        });
    } catch (error) {
        console.error('[ColorRGB] Error starting RGB loop:', error);
        return message.reply({
            embeds: [{
                color: 0xa82d43,
                description: `❌ Error starting RGB loop: ${error.message}`
            }]
        });
    }
}

async function handleStopCommand(message) {
    if (!rgbColorLoop.activeLoops.has(message.guild.id)) {
        return message.reply({
            embeds: [{
                color: 0xa82d43,
                description: '❌ No active RGB loop in this server'
            }]
        });
    }

    rgbColorLoop.stopRGBLoop(message.guild.id);
    GuildConfig.clearRGBLoop(message.guild.id);

    return message.reply({
        embeds: [{
            color: 0x7ab158,
            description: '✅ RGB loop stopped. Members kept their final role.'
        }]
    });
}

async function handleStatusCommand(message) {
    const status = rgbColorLoop.getLoopStatus(message.guild.id);

    if (!status.active) {
        return message.reply({
            embeds: [{
                color: 0x3c3b40,
                description: 'ℹ️ No active RGB loop in this server'
            }]
        });
    }

    const roleNames = status.roles
        .map(id => message.guild.roles.cache.get(id)?.name)
        .filter(Boolean)
        .join(' → ');

    const uptime = Math.floor((Date.now() - status.startedAt) / 1000);
    const uptimeText = uptime < 60
        ? `${uptime}s`
        : uptime < 3600
        ? `${Math.floor(uptime / 60)}m`
        : `${Math.floor(uptime / 3600)}h`;

    return message.reply({
        embeds: [{
            color: 0x5b6fee,
            title: 'RGB Loop Status',
            fields: [
                { name: 'Status', value: '🟢 Active', inline: true },
                { name: 'Uptime', value: uptimeText, inline: true },
                { name: 'Roles', value: roleNames, inline: false },
                { name: 'Interval', value: `${status.interval}ms`, inline: true },
                { name: 'Total Roles', value: `${status.roles.length}`, inline: true }
            ]
        }]
    });
}
