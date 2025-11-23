const GuildConfig = require('../database/guildConfig');
const ActiveRooms = require('../database/activeRooms');

module.exports = (client) => {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (oldState.channelId === newState.channelId) return;
        if (!newState.channelId || !newState.guild || !newState.member) return;

        const user = newState.member;
        const guild = newState.guild;
        const joinedChannel = newState.channel;

        const guildConfig = GuildConfig.getVoiceMasterConfig(guild.id);
        if (!guildConfig || !guildConfig.generator) return;

        const generatorId = guildConfig.generator;

        if (joinedChannel.id === generatorId) {
            const category = joinedChannel.parent;

            try {
                const newChannel = await guild.channels.create({
                    name: `${user.displayName}'s room`,
                    type: 2, // GuildVoice
                    parent: category ?? null,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            allow: ['Connect'], // Ahora el canal estará desbloqueado
                        },
                        {
                            id: user.id,
                            allow: ['Connect', 'ManageChannels', 'MoveMembers'],
                        },
                    ],
                });

                await user.voice.setChannel(newChannel);

                // Save to database
                ActiveRooms.create(newChannel.id, guild.id, user.id);

                // Auto-delete when empty
                const interval = setInterval(() => {
                    if (!newChannel.members.size) {
                        newChannel.delete().catch(() => {});
                        ActiveRooms.delete(newChannel.id);
                        clearInterval(interval);
                    }
                }, 1000);
            } catch (err) {
                console.error('[VoiceMaster Error]', err);
            }
        }
    });
};
