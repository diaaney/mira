const GuildConfig = require('../database/guildConfig');
const rgbColorLoop = require('../utils/rgbColorLoop');

module.exports = (client) => {
    client.on('roleDelete', async (role) => {
        const guildId = role.guild.id;
        const roleIds = GuildConfig.getRGBLoopRoles(guildId);

        if (!roleIds) return;

        // Si el rol deletado estaba en el loop RGB
        if (roleIds.includes(role.id)) {
            console.log(`[RGB] Role ${role.name} deleted. Stopping loop in ${role.guild.name}`);

            // Detener loop
            rgbColorLoop.stopRGBLoop(guildId);
            GuildConfig.clearRGBLoop(guildId);

            // Notificar al dueño del servidor
            try {
                const owner = await role.guild.fetchOwner();
                await owner.send({
                    embeds: [{
                        color: 0xdca60d,
                        title: '⚠️ RGB Loop Stopped',
                        description: `A role in your RGB loop was deleted in **${role.guild.name}**`,
                        fields: [
                            { name: 'Deleted Role', value: role.name },
                            { name: 'Action', value: 'RGB loop has been automatically stopped' }
                        ]
                    }]
                });
            } catch (error) {
                console.error('[RGB] Could not DM server owner:', error);
            }
        }
    });
};
