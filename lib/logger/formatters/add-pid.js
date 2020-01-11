const { format } = require('logform');

const addPid = format((info) => Object.assign(info, { pid: process.pid }));

module.exports = addPid;
