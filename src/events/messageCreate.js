const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const {
    getCountingConfig,
    updateCount,
    resetCount,
    isAfk,
    removeAfk,
    getReactMessage,
    decrementReactMessage,
    getActiveBooster,
    setActiveBooster,
} = require('../utils/storage');
const embeds = require('../constants/embeds');
const { generateBooster } = require('../utils/boosterOps');
const { WRONG_NUMBER_LINES, pickLine, fillTokens } = require('../constants/countingLines');

const BOOSTER_CHANCE = 0.08;

module.exports = (client) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        // --- 🔹 AFK SYSTEM ---
        // Check if author is AFK and remove it
        const authorAfk = isAfk(message.author.id);
        if (authorAfk) {
            removeAfk(message.author.id);
            const duration = Math.floor((Date.now() - authorAfk.since) / 1000);
            const minutes = Math.floor(duration / 60);
            const timeStr = minutes > 0 ? `${minutes}m` : `${duration}s`;

            await message.reply({
                embeds: [embeds.success(`welcome back! you were afk for **${timeStr}**`)]
            }).catch(() => {});
        }

        // Check if message mentions any AFK users
        if (message.mentions.users.size > 0) {
            for (const [userId, user] of message.mentions.users) {
                const afkData = isAfk(userId);
                if (afkData) {
                    const duration = Math.floor((Date.now() - afkData.since) / 1000);
                    const minutes = Math.floor(duration / 60);
                    const timeStr = minutes > 0 ? `${minutes}m ago` : `${duration}s ago`;

                    await message.reply({
                        embeds: [embeds.success(`yo ${user.username} is afk rn - **${afkData.reason}** (${timeStr})`)]
                    }).catch(() => {});
                    break; // Only show one AFK message per message
                }
            }
        }

        // --- 🔹 REACT MESSAGES ---
        const reactData = getReactMessage(message.author.id);
        if (reactData) {
            await message.react(reactData.emoji).catch(() => {});
            decrementReactMessage(message.author.id);
        }

        // --- 🔹 COUNTING GAME ---
        const countConfig = getCountingConfig();
        if (countConfig.channel_id === message.channel.id) {
            const userNumber = parseInt(message.content.trim());

            // Check if message is a valid number
            if (!isNaN(userNumber) && message.content.trim() === userNumber.toString()) {
                const expectedNumber = countConfig.current_number + 1;
                const isSameUser = countConfig.last_user_id === message.author.id;

                // Silently ignore if same user tries to count again (regardless of number)
                if (isSameUser && countConfig.current_number > 0) {
                    return;
                }

                // Check if it's the correct number
                if (userNumber === expectedNumber) {
                    // Correct number and different user (or first number)
                    await message.react('✅');
                    updateCount(userNumber, message.author.id);

                    // Booster roll: only if no active booster
                    if (!getActiveBooster() && Math.random() < BOOSTER_CHANCE) {
                        const booster = generateBooster(userNumber);
                        const row = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`booster_claim:${booster.id}`)
                                .setLabel('claim it')
                                .setEmoji('🎯')
                                .setStyle(ButtonStyle.Primary)
                        );
                        const content = `⚡ booster spawned — solve \`${booster.expression}\` and the count gets **${booster.type}**`;
                        try {
                            const sent = await message.channel.send({ content, components: [row] });
                            booster.channel_id = sent.channelId;
                            booster.message_id = sent.id;
                            setActiveBooster(booster);
                        } catch (err) {
                            console.error('[Counting] failed to spawn booster:', err);
                        }
                    }
                } else {
                    // Wrong number - reset and clear last user so they can restart
                    await message.react('❌');
                    const reached = countConfig.current_number;
                    resetCount();

                    const line = fillTokens(pickLine(WRONG_NUMBER_LINES), {
                        user: `${message.author}`,
                        expected: expectedNumber,
                        got: userNumber,
                        reached: reached,
                    });

                    await message.reply({
                        content: line,
                        allowedMentions: { repliedUser: false, parse: ['users'] }
                    });
                }
                return;
            }
        }

        // --- 🔹 COMANDOS PREFIX ---
        const prefix = '!';

        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();

        const command = client.prefixCommands.get(cmd);
        if (!command) return;

        try {
            await command.execute(message, args);
        } catch (error) {
            console.error(error);
            await message.reply('❌ Error executing command');
        }
    });
};
