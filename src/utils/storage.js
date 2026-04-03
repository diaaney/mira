const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const ROOMS_FILE = path.join(DATA_DIR, 'rooms.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({
        voicemaster: {
            generator_id: null,
            category_id: null,
            panel_id: null
        },
        counting: {
            channel_id: null,
            current_number: 0,
            last_user_id: null
        },
        welcome: {
            channel_id: null
        },
        afk_users: {}
    }, null, 2));
}

if (!fs.existsSync(ROOMS_FILE)) {
    fs.writeFileSync(ROOMS_FILE, JSON.stringify([], null, 2));
}

// Read and write helpers
function readConfig() {
    const data = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
}

function writeConfig(config) {
    // Write to main file
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

    // Create backup for safety
    const BACKUP_FILE = path.join(DATA_DIR, 'config.backup.json');
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(config, null, 2));
}

function readRooms() {
    const data = fs.readFileSync(ROOMS_FILE, 'utf8');
    return JSON.parse(data);
}

function writeRooms(rooms) {
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2));
}

// VoiceMaster Config Functions
function getVoicemasterConfig() {
    const config = readConfig();
    return config.voicemaster;
}

function setVoicemasterConfig(generator_id, category_id, panel_id) {
    const config = readConfig();
    config.voicemaster = {
        generator_id,
        category_id,
        panel_id
    };
    writeConfig(config);
}

// Active Rooms Functions
function createRoom(channel_id, owner_id) {
    const rooms = readRooms();
    rooms.push({
        channel_id,
        owner_id,
        created_at: new Date().toISOString(),
        claimed_at: null
    });
    writeRooms(rooms);
}

function deleteRoom(channel_id) {
    const rooms = readRooms();
    const filtered = rooms.filter(room => room.channel_id !== channel_id);
    writeRooms(filtered);
}

function getRoom(channel_id) {
    const rooms = readRooms();
    return rooms.find(room => room.channel_id === channel_id) || null;
}

function isOwner(channel_id, user_id) {
    const room = getRoom(channel_id);
    return room ? room.owner_id === user_id : false;
}

function claimRoom(channel_id, new_owner_id) {
    const rooms = readRooms();
    const room = rooms.find(r => r.channel_id === channel_id);
    if (room) {
        room.owner_id = new_owner_id;
        room.claimed_at = new Date().toISOString();
        writeRooms(rooms);
        return true;
    }
    return false;
}

function getAllRooms() {
    return readRooms();
}

// Counting Functions
function getCountingConfig() {
    const config = readConfig();
    if (!config.counting) {
        config.counting = {
            channel_id: null,
            current_number: 0,
            last_user_id: null
        };
        writeConfig(config);
    }
    return config.counting;
}

function setCountingChannel(channel_id) {
    const config = readConfig();
    config.counting = {
        channel_id,
        current_number: 0,
        last_user_id: null
    };
    writeConfig(config);
}

function updateCount(new_number, user_id) {
    const config = readConfig();
    config.counting.current_number = new_number;
    config.counting.last_user_id = user_id;
    writeConfig(config);
}

function resetCount() {
    const config = readConfig();
    config.counting.current_number = 0;
    config.counting.last_user_id = null;
    writeConfig(config);
}

// AFK Functions
function getAfkUsers() {
    const config = readConfig();
    if (!config.afk_users) {
        config.afk_users = {};
        writeConfig(config);
    }
    return config.afk_users;
}

function setAfk(user_id, reason) {
    const config = readConfig();
    if (!config.afk_users) {
        config.afk_users = {};
    }
    config.afk_users[user_id] = {
        reason: reason || 'no reason provided',
        since: Date.now()
    };
    writeConfig(config);
}

function removeAfk(user_id) {
    const config = readConfig();
    if (!config.afk_users) {
        config.afk_users = {};
    }
    if (config.afk_users[user_id]) {
        delete config.afk_users[user_id];
        writeConfig(config);
        return true;
    }
    return false;
}

function isAfk(user_id) {
    const afkUsers = getAfkUsers();
    return afkUsers[user_id] || null;
}

// Welcome Functions
function getWelcomeConfig() {
    const config = readConfig();
    if (!config.welcome) {
        config.welcome = {
            channel_id: null
        };
        writeConfig(config);
    }
    return config.welcome;
}

function setWelcomeChannel(channel_id) {
    const config = readConfig();
    config.welcome = {
        channel_id
    };
    writeConfig(config);
}

module.exports = {
    getVoicemasterConfig,
    setVoicemasterConfig,
    createRoom,
    deleteRoom,
    getRoom,
    isOwner,
    claimRoom,
    getAllRooms,
    getCountingConfig,
    setCountingChannel,
    updateCount,
    resetCount,
    getAfkUsers,
    setAfk,
    removeAfk,
    isAfk,
    getWelcomeConfig,
    setWelcomeChannel
};
