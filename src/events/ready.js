const { ActivityType } = require('discord.js');

module.exports = (client) => {
    client.once('ready', async () => {
        console.log(`✅ Mira está lista como ${client.user.tag}`);

        // Set streaming status (purple badge)
        client.user.setPresence({
            activities: [{
                name: 'always listening to you ♡',
                type: ActivityType.Streaming,
                url: 'https://twitch.tv/mira'
            }],
            status: 'online'
        });

        console.log('💜 Status set to: Streaming "always listening to you ♡"');
    });
};
