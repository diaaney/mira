const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../../database/guildConfig');
const rgbColorLoop = require('../../../utils/rgbColorLoop');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('colorrgb')
        .setDescription('Manage dynamic RGB color rotation on roles')
        .addRoleOption(option =>
            option.setName('role1')
                .setDescription('First color role')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('role2')
                .setDescription('Second color role')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('role3')
                .setDescription('Third color role')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('role4')
                .setDescription('Fourth color role')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('role5')
                .setDescription('Fifth color role')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Start or stop the RGB loop')
                .setRequired(true)
                .addChoices(
                    { name: 'Start', value: 'start' },
                    { name: 'Stop', value: 'stop' },
                    { name: 'Status', value: 'status' }
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const action = interaction.options.getString('action');
        const guild = interaction.guild;

        // Validar permisos del bot
        if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({
                embeds: [{
                    color: 0xa82d43,
                    description: '❌ I need **Manage Roles** permission'
                }],
                ephemeral: true
            });
        }

        if (action === 'status') {
            return handleStatusCommand(interaction, guild);
        }

        if (action === 'stop') {
            return handleStopCommand(interaction, guild);
        }

        // action === 'start'
        return handleStartCommand(interaction, guild);
    }
};

async function handleStartCommand(interaction, guild) {
    const roleIds = [];

    // Recopilar roles del comando
    for (let i = 1; i <= 5; i++) {
        const role = interaction.options.getRole(`role${i}`);
        if (role) {
            roleIds.push(role.id);
        }
    }

    // Validar cantidad mínima
    if (roleIds.length < 2) {
        return interaction.reply({
            embeds: [{
                color: 0xa82d43,
                description: '❌ You need at least 2 roles for RGB rotation'
            }],
            ephemeral: true
        });
    }

    // Validar roles
    try {
        rgbColorLoop.validateRoles(guild, roleIds);
    } catch (error) {
        return interaction.reply({
            embeds: [{
                color: 0xa82d43,
                description: `❌ ${error.message}`
            }],
            ephemeral: true
        });
    }

    // Detener loop anterior si existe
    if (rgbColorLoop.activeLoops.has(guild.id)) {
        rgbColorLoop.stopRGBLoop(guild.id);
    }

    // Guardar config en BD
    GuildConfig.setRGBLoopRoles(guild.id, roleIds);

    // Iniciar loop
    try {
        await rgbColorLoop.startRGBLoop(guild, roleIds, 1500);

        const roleNames = roleIds
            .map(id => guild.roles.cache.get(id)?.name)
            .filter(Boolean)
            .join(' → ');

        return interaction.reply({
            embeds: [{
                color: 0x7ab158,
                title: '✅ RGB Loop Started',
                description: `Rotating through: **${roleNames}**`,
                fields: [
                    { name: 'Interval', value: '1.5 seconds', inline: true },
                    { name: 'Total Roles', value: `${roleIds.length}`, inline: true }
                ]
            }],
            ephemeral: true
        });
    } catch (error) {
        console.error('[ColorRGB] Error starting RGB loop:', error);
        return interaction.reply({
            embeds: [{
                color: 0xa82d43,
                description: `❌ Error starting RGB loop: ${error.message}`
            }],
            ephemeral: true
        });
    }
}

async function handleStopCommand(interaction, guild) {
    if (!rgbColorLoop.activeLoops.has(guild.id)) {
        return interaction.reply({
            embeds: [{
                color: 0xa82d43,
                description: '❌ No active RGB loop in this server'
            }],
            ephemeral: true
        });
    }

    rgbColorLoop.stopRGBLoop(guild.id);
    GuildConfig.clearRGBLoop(guild.id);

    return interaction.reply({
        embeds: [{
            color: 0x7ab158,
            description: '✅ RGB loop stopped. Members kept their final role.'
        }],
        ephemeral: true
    });
}

async function handleStatusCommand(interaction, guild) {
    const status = rgbColorLoop.getLoopStatus(guild.id);

    if (!status.active) {
        return interaction.reply({
            embeds: [{
                color: 0x3c3b40,
                description: 'ℹ️ No active RGB loop in this server'
            }],
            ephemeral: true
        });
    }

    const roleNames = status.roles
        .map(id => guild.roles.cache.get(id)?.name)
        .filter(Boolean)
        .join(' → ');

    const uptime = Math.floor((Date.now() - status.startedAt) / 1000);
    const uptimeText = uptime < 60
        ? `${uptime}s`
        : uptime < 3600
        ? `${Math.floor(uptime / 60)}m`
        : `${Math.floor(uptime / 3600)}h`;

    return interaction.reply({
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
        }],
        ephemeral: true
    });
}
