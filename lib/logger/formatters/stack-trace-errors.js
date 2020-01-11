const { format } = require('logform');
const stackTrace = require('stack-trace');

/**
 * Gets a stack trace for the specified error.
 * @param {Object} [err]
 * @returns {Object}
 */
function getTrace(err) {
  const trace = err ? stackTrace.parse(err) : stackTrace.get();
  return trace.map((site) => ({
    column: site.getColumnNumber(),
    file: site.getFileName(),
    function: site.getFunctionName(),
    line: site.getLineNumber(),
    method: site.getMethodName(),
    native: site.isNative(),
  }));
}

module.exports = format((info, opts = { simplified: true }) => {
  if (info instanceof Error || typeof info.stack !== 'undefined') {
    return {
      ...info,
      message: info.message,
      level: info.level,
      stack: opts.simplified ? info.stack : getTrace(info),
    };
  }

  return info;
});
