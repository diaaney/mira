const { getCountingConfig } = require('../utils/storage');

module.exports = (client) => {
    client.on('messageDelete', async (message) => {
        if (message.partial) return;
        if (!message.author || message.author.bot) return;

        const countConfig = getCountingConfig();
        if (countConfig.channel_id !== message.channel.id) return;

        const content = message.content?.trim();
        if (!content) return;

        const deletedNumber = parseInt(content);
        if (isNaN(deletedNumber) || content !== deletedNumber.toString()) return;

        if (deletedNumber !== countConfig.current_number) return;
        if (message.author.id !== countConfig.last_user_id) return;

        await message.channel.send({
            content: `**${deletedNumber}** — counted by ${message.author} (deleted the message, but the count stays)`
        }).catch(() => {});
    });
};
