const ActiveRooms = require('../database/activeRooms');

module.exports = async (client) => {
    const activeRooms = ActiveRooms.getAll();
    const toDelete = [];

    for (const room of activeRooms) {
        const channel = await client.channels.fetch(room.channel_id).catch(() => null);
        if (!channel) {
            toDelete.push(room.channel_id);
        }
    }

    if (toDelete.length > 0) {
        ActiveRooms.deleteMany(toDelete);
        console.log(`[VoiceMaster] Cleaned up ${toDelete.length} invalid channels`);
    }
};
