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
        afk_users: {},
        react_messages: {}
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
    config.counting.active_booster = null;
    writeConfig(config);
}

function getActiveBooster() {
    const config = readConfig();
    return config.counting?.active_booster || null;
}

function setActiveBooster(booster) {
    const config = readConfig();
    if (!config.counting) {
        config.counting = { channel_id: null, current_number: 0, last_user_id: null };
    }
    config.counting.active_booster = booster;
    writeConfig(config);
}

function clearActiveBooster() {
    const config = readConfig();
    if (config.counting) {
        config.counting.active_booster = null;
        writeConfig(config);
    }
}

function applyBoostToCount(newCount) {
    const config = readConfig();
    config.counting.current_number = newCount;
    config.counting.active_booster = null;
    writeConfig(config);
}

// Item drop functions
function getActiveDrop() {
    const config = readConfig();
    return config.counting?.active_drop || null;
}

function setActiveDrop(drop) {
    const config = readConfig();
    if (!config.counting) {
        config.counting = { channel_id: null, current_number: 0, last_user_id: null };
    }
    config.counting.active_drop = drop;
    writeConfig(config);
}

function clearActiveDrop() {
    const config = readConfig();
    if (config.counting) {
        config.counting.active_drop = null;
        writeConfig(config);
    }
}

// User stats functions
const DEFAULT_USER_STATS = {
    total_count: 0,
    numbers_counted: 0,
    items: {
        streak_shield: 0,
        perfect_aim: 0,
        sabotage: 0,
        oracle_eye: 0,
    },
    protecting_through: null,
    primed: {
        perfect_aim: false,
        oracle_eye: false,
    },
    sabotaged: false,
};

function defaultStats() {
    return JSON.parse(JSON.stringify(DEFAULT_USER_STATS));
}

function ensureUserStatsObject(config, user_id) {
    if (!config.user_stats) config.user_stats = {};
    if (!config.user_stats[user_id]) {
        config.user_stats[user_id] = defaultStats();
        return true;
    }
    // Migrate missing fields
    const stats = config.user_stats[user_id];
    let changed = false;
    if (typeof stats.total_count !== 'number') { stats.total_count = 0; changed = true; }
    if (typeof stats.numbers_counted !== 'number') { stats.numbers_counted = 0; changed = true; }
    if (!stats.items) { stats.items = { ...DEFAULT_USER_STATS.items }; changed = true; }
    for (const key of Object.keys(DEFAULT_USER_STATS.items)) {
        if (typeof stats.items[key] !== 'number') { stats.items[key] = 0; changed = true; }
    }
    if (!('protecting_through' in stats)) { stats.protecting_through = null; changed = true; }
    if (!stats.primed) { stats.primed = { ...DEFAULT_USER_STATS.primed }; changed = true; }
    for (const key of Object.keys(DEFAULT_USER_STATS.primed)) {
        if (typeof stats.primed[key] !== 'boolean') { stats.primed[key] = false; changed = true; }
    }
    if (typeof stats.sabotaged !== 'boolean') { stats.sabotaged = false; changed = true; }
    return changed;
}

function getUserStats(user_id) {
    const config = readConfig();
    const created = ensureUserStatsObject(config, user_id);
    if (created) writeConfig(config);
    return config.user_stats[user_id];
}

function getAllUserStats() {
    const config = readConfig();
    return config.user_stats || {};
}

function addToTotalCount(user_id, n) {
    const config = readConfig();
    ensureUserStatsObject(config, user_id);
    config.user_stats[user_id].total_count += n;
    config.user_stats[user_id].numbers_counted += 1;
    writeConfig(config);
}

function addItem(user_id, item_type, qty = 1) {
    const config = readConfig();
    ensureUserStatsObject(config, user_id);
    config.user_stats[user_id].items[item_type] =
        (config.user_stats[user_id].items[item_type] || 0) + qty;
    writeConfig(config);
}

function removeItem(user_id, item_type, qty = 1) {
    const config = readConfig();
    ensureUserStatsObject(config, user_id);
    const current = config.user_stats[user_id].items[item_type] || 0;
    if (current < qty) return false;
    config.user_stats[user_id].items[item_type] = current - qty;
    writeConfig(config);
    return true;
}

function primeItem(user_id, item_type) {
    const config = readConfig();
    ensureUserStatsObject(config, user_id);
    config.user_stats[user_id].primed[item_type] = true;
    writeConfig(config);
}

function unprimeItem(user_id, item_type) {
    const config = readConfig();
    ensureUserStatsObject(config, user_id);
    config.user_stats[user_id].primed[item_type] = false;
    writeConfig(config);
}

function setSabotaged(target_id) {
    const config = readConfig();
    ensureUserStatsObject(config, target_id);
    config.user_stats[target_id].sabotaged = true;
    writeConfig(config);
}

function clearSabotaged(target_id) {
    const config = readConfig();
    ensureUserStatsObject(config, target_id);
    config.user_stats[target_id].sabotaged = false;
    writeConfig(config);
}

function armShield(user_id, current_number) {
    const config = readConfig();
    ensureUserStatsObject(config, user_id);
    const stats = config.user_stats[user_id];
    if (stats.items.streak_shield > 0) {
        stats.protecting_through = current_number + 25;
        writeConfig(config);
        return true;
    }
    return false;
}

function findShieldSaver(current_number) {
    const config = readConfig();
    if (!config.user_stats) return null;
    const candidates = [];
    for (const [user_id, stats] of Object.entries(config.user_stats)) {
        if (
            stats.protecting_through !== null &&
            stats.protecting_through !== undefined &&
            current_number <= stats.protecting_through &&
            (stats.items?.streak_shield || 0) >= 1
        ) {
            candidates.push(user_id);
        }
    }
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function consumeShield(user_id) {
    const config = readConfig();
    ensureUserStatsObject(config, user_id);
    const stats = config.user_stats[user_id];
    if (stats.items.streak_shield > 0) {
        stats.items.streak_shield -= 1;
        stats.protecting_through = null;
        writeConfig(config);
        return true;
    }
    return false;
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

// Personal Color Roles
function getPersonalColor(user_id) {
    const config = readConfig();
    if (!config.personal_colors) return null;
    return config.personal_colors[user_id] || null;
}

function setPersonalColor(user_id, role_id) {
    const config = readConfig();
    if (!config.personal_colors) config.personal_colors = {};
    config.personal_colors[user_id] = role_id;
    writeConfig(config);
}

// Autorole Functions
function getAutoroleConfig() {
    const config = readConfig();
    if (!config.autorole) {
        config.autorole = { role_id: null };
        writeConfig(config);
    }
    return config.autorole;
}

function setAutoroleConfig(role_id) {
    const config = readConfig();
    config.autorole = { role_id };
    writeConfig(config);
}

// Welcome Functions
function getWelcomeConfig() {
    const config = readConfig();
    if (!config.welcome) {
        config.welcome = {
            channel_id: null,
            featured_channels: [],
            image_url: null
        };
        writeConfig(config);
    }
    // Migrate: ensure featured_channels exists
    if (!Array.isArray(config.welcome.featured_channels)) {
        config.welcome.featured_channels = [];
        writeConfig(config);
    }
    // Migrate: ensure image_url exists
    if (!('image_url' in config.welcome)) {
        config.welcome.image_url = null;
        writeConfig(config);
    }
    return config.welcome;
}

function setWelcomeChannel(channel_id) {
    const config = readConfig();
    if (!config.welcome) config.welcome = { channel_id: null, featured_channels: [] };
    config.welcome.channel_id = channel_id;
    if (!Array.isArray(config.welcome.featured_channels)) {
        config.welcome.featured_channels = [];
    }
    writeConfig(config);
}

function setWelcomeFeaturedChannels(channel_ids) {
    const config = readConfig();
    if (!config.welcome) config.welcome = { channel_id: null, featured_channels: [] };
    config.welcome.featured_channels = (channel_ids || []).filter(Boolean);
    writeConfig(config);
}

function setWelcomeImage(image_url) {
    const config = readConfig();
    if (!config.welcome) config.welcome = { channel_id: null, featured_channels: [] };
    config.welcome.image_url = image_url || null;
    writeConfig(config);
}

// React Messages Functions
function setReactMessage(user_id, emoji, count) {
    const config = readConfig();
    if (!config.react_messages) config.react_messages = {};
    config.react_messages[user_id] = { emoji, remaining: count };
    writeConfig(config);
}

function getReactMessage(user_id) {
    const config = readConfig();
    if (!config.react_messages) return null;
    return config.react_messages[user_id] || null;
}

function decrementReactMessage(user_id) {
    const config = readConfig();
    if (!config.react_messages || !config.react_messages[user_id]) return;
    config.react_messages[user_id].remaining -= 1;
    if (config.react_messages[user_id].remaining <= 0) {
        delete config.react_messages[user_id];
    }
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
    getActiveBooster,
    setActiveBooster,
    clearActiveBooster,
    applyBoostToCount,
    getActiveDrop,
    setActiveDrop,
    clearActiveDrop,
    getUserStats,
    getAllUserStats,
    addToTotalCount,
    addItem,
    removeItem,
    primeItem,
    unprimeItem,
    setSabotaged,
    clearSabotaged,
    armShield,
    findShieldSaver,
    consumeShield,
    getAfkUsers,
    setAfk,
    removeAfk,
    isAfk,
    getWelcomeConfig,
    setWelcomeChannel,
    setWelcomeFeaturedChannels,
    setWelcomeImage,
    setReactMessage,
    getReactMessage,
    decrementReactMessage,
    getAutoroleConfig,
    setAutoroleConfig,
    getPersonalColor,
    setPersonalColor
};
