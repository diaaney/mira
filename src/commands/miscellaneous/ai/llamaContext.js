const LlamaContext = require('../../../database/llamaContext');

module.exports = {
    get: (channelId) => LlamaContext.get(channelId),
    add: (channelId, message) => LlamaContext.add(channelId, message),
    format: (channelId) => LlamaContext.format(channelId),
};
