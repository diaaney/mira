const { ActivityType } = require('discord.js');

// Rotating presences — keeps the original plus some snarky ones
const STATUSES = [
    { name: 'always listening to you ♡', type: ActivityType.Streaming, url: 'https://twitch.tv/mira' },
    { name: 'happy e-dating! ♡', type: ActivityType.Streaming, url: 'https://twitch.tv/mira' },
    { name: 'your situationship fall apart', type: ActivityType.Watching },
    { name: 'you lose the count', type: ActivityType.Watching },
    { name: 'touch grass challenge', type: ActivityType.Competing },
    { name: 'parasocial relationships', type: ActivityType.Listening },
    { name: 'you type and delete that message', type: ActivityType.Watching },
    { name: 'go outside maybe? ♡', type: ActivityType.Playing },
];

const ROTATE_EVERY_MS = 30_000; // switch status every 30s

module.exports = (client) => {
    client.once('ready', async () => {
        console.log(`✅ Mira está lista como ${client.user.tag}`);

        let index = 0;

        const apply = () => {
            const status = STATUSES[index];
            client.user.setPresence({
                activities: [status],
                status: 'online'
            });
            console.log(`💜 Status set to: ${ActivityType[status.type]} "${status.name}"`);
            index = (index + 1) % STATUSES.length;
        };

        // Set the first status immediately, then rotate on an interval
        apply();
        setInterval(apply, ROTATE_EVERY_MS);
    });
};
