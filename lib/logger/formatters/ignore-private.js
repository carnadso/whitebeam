const { format } = require('logform');

const ignorePrivate = format((info) => {
  if (info.private) {
    return false;
  }

  return info;
});

module.exports = ignorePrivate;
