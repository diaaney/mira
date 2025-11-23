const ActiveRooms = require('../../database/activeRooms');

function isOwner(channelId, userId) {
    return ActiveRooms.isOwner(channelId, userId);
}

module.exports = { isOwner };
