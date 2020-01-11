/* eslint-disable no-param-reassign */
const { format } = require('logform');

module.exports = format((info, opts) => {
  if (opts.message) {
    info.message = `[${opts.application || ''}:${opts.label}] ${info.message}`;
    return info;
  }

  info.label = opts.label;
  info.application = opts.application;
  return info;
});
