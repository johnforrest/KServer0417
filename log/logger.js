var log4js = require('log4js');
log4js.configure({
    appenders: {
        console: { type: 'console' },
        cheeseLogs: { type: 'file', filename: 'log/cheese4.log', category: 'cheese' }
    },
    categories: {

        default: { appenders: ['console', 'cheeseLogs'], level: 'info' }

    }
});
var logger = log4js.getLogger('cheese');

module.exports = logger;
