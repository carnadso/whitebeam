const { getClientIp } = require('request-ip');

function ip(req) {
  return getClientIp(req);
}

module.exports = ip;
