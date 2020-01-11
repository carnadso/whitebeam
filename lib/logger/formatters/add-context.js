const domain = require('domain');
const { format } = require('logform');

const addContext = format((info) => {
  const logContext = (domain.active && domain.active.logContext) || false;
  if (!logContext) {
    return info;
  }

  return Object.assign(info, logContext);
});

module.exports = addContext;
