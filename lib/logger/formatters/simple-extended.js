/* eslint-disable no-param-reassign */
const { format } = require('logform');
const { MESSAGE } = require('triple-beam');

module.exports = format((info, opts = { meta: true }) => {
  const skipMeta = typeof opts.meta === 'boolean' && opts.meta === false;

  let stringifiedRest = '';
  if (!skipMeta) {
    const stringifySource = {
      ...info,
      level: undefined,
      message: undefined,
      splat: undefined,
      ruid: undefined,
      pvid: undefined,
      http_method: undefined,
      http_path: undefined,
      sid: undefined,
      uid: undefined,
      pid: undefined,
      label: undefined,
      application: undefined,
      timestamp: undefined,
      padding: undefined,
    };

    // We place the stack trace at the end always
    delete stringifySource.stack;
    stringifiedRest = JSON.stringify(stringifySource);
  }

  const extractedStack = info.stack;
  if (extractedStack) {
    stringifiedRest += `\n${extractedStack}`;
  }

  const padding = (info.padding && info.padding[info.level]) || '';
  const commonMessage = `${info.timestamp} ${info.level}:${padding} [${info.application || ''}:${info.label || ''}] [${info.pid}:${info.ruid || ''}:${info.pvid || ''}:${info.sid || ''}:${info.uid || ''}] ${info.message}`;
  if (!skipMeta && stringifiedRest !== '{}') {
    info[MESSAGE] = `${commonMessage} ${stringifiedRest}`;
  } else {
    info[MESSAGE] = commonMessage;
  }

  return info;
});
