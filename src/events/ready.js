const cleanActiveRooms = require('../utils/cleanActiveRooms');
const rgbColorLoop = require('../utils/rgbColorLoop');
const GuildConfig = require('../database/guildConfig');

module.exports = (client) => {
    client.once('ready', async () => {
        console.log(`✅ Mira está lista como ${client.user.tag}`);
        await cleanActiveRooms(client);

        // Restaurar RGB loops
        const guilds = await client.guilds.fetch();
        for (const [guildId, guild] of guilds) {
            try {
                const roleIds = GuildConfig.getRGBLoopRoles(guildId);
                if (roleIds && roleIds.length >= 2) {
                    const guildObj = await client.guilds.fetch(guildId);
                    await rgbColorLoop.startRGBLoop(
                        guildObj,
                        roleIds,
                        GuildConfig.getRGBLoopInterval(guildId)
                    );
                    console.log(`[RGB] Restored loop for guild ${guildId}`);
                }
            } catch (error) {
                console.error(`[RGB] Error restoring loop for ${guildId}:`, error);
            }
        }
    });
};
