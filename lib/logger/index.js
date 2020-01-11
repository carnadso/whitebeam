const fs = require('fs');
const winston = require('winston');
const { format } = require('logform');
const { LEVEL } = require('triple-beam');

const {
  ignorePrivate,
  removeSecrets,
  addContext,
  simpleExtended,
  addPid,
  applicationLabel,
  stackTraceErrors,
} = require('./formatters');

const {
  combine, timestamp, colorize, json, splat,
} = format;

const DEFAULT_LOGGER_NAME = 'default';

function loggerFactory(opts = {
  application: process.env.WHITEBEAM_APPLICATION_NAME || null,
  defaultLoggerOpts: {},
}) {
  // A dictionary of all the known loggers
  const knownLoggers = {};

  // Creates a Winston logger object
  function createLogger(application = null, name = undefined, config = {}) {
    const loggerName = name || DEFAULT_LOGGER_NAME;
    const configObject = typeof config === 'string'
      ? JSON.parse(fs.readFileSync(config))
      : config;

    const formatterList = [
      timestamp(),
      applicationLabel({
        label: loggerName,
        application,
      }),
      addPid(),
      ignorePrivate(),
      removeSecrets(),
      addContext(),
      splat(),
    ];

    if (process.env.NODE_ENV === 'development') {
      formatterList.unshift(stackTraceErrors({ simplified: true }));
      formatterList.push(colorize());
      formatterList.push(simpleExtended({ meta: config.meta }));
    } else {
      formatterList.unshift(stackTraceErrors({ simplified: false }));
      formatterList.push(json());
    }

    const loggerOptions = {
      transports: [new winston.transports.Console()],
      label: loggerName,
      format: combine(...formatterList),
      ...configObject,
    };

    const brandNewLogger = winston.loggers.add(`${application}:${loggerName}`, loggerOptions);

    // Winston has some nasty limitations right now (2018-06) regarding logging
    // errors as the "splat" parameter, so we need to monkey-patch the log levels
    // to wrap around an object that's not really an Error instance (since Error's
    // 'message' and 'stack' properties are non-copyable via Object.assign)
    Object.keys(brandNewLogger.levels).forEach((level) => {
      brandNewLogger[level] = (...args) => {
        // Optimize the hot-path which is the single object.
        if (args.length === 1) {
          const [msg] = args;
          // eslint-disable-next-line no-mixed-operators
          const info = msg && msg.message && msg || { message: msg };
          // eslint-disable-next-line no-multi-assign
          info.level = info[LEVEL] = level;
          return brandNewLogger.write.call(brandNewLogger, info);
        }

        if (args.length === 2 && args[1] instanceof Error) {
          const copiedError = {
            err_message: args[1].message,
            stack: args[1].stack,
          };

          const copiedArgs = args.concat([]);
          copiedArgs[1] = copiedError;

          return brandNewLogger.log.call(brandNewLogger, level, ...copiedArgs);
        }

        // Otherwise build argument list which could potentially conform to
        // either:
        // . v3 API: log(obj)
        // 2. v1/v2 API: log(level, msg, ... [string interpolate], [{metadata}], [callback])
        return brandNewLogger.log.call(brandNewLogger, level, ...args);
      };
    });
    return brandNewLogger;
  }

  // Prepare the output function
  const output = function whitebeam(componentName = 'default', componentConfig = {}) {
    let requestedLogger = knownLoggers[componentName];
    if (!requestedLogger) {
      requestedLogger = createLogger(opts.application, componentName, componentConfig);
      knownLoggers[componentName] = requestedLogger;
    }

    return requestedLogger;
  };

  output.default = createLogger(opts.application, DEFAULT_LOGGER_NAME, opts.defaultLoggerOpts);
  knownLoggers[DEFAULT_LOGGER_NAME] = output.default;

  // Map the default logger on the output function (yes, map everything)
  // eslint-disable-next-line no-restricted-syntax
  for (const key in knownLoggers[DEFAULT_LOGGER_NAME]) {
    if (typeof knownLoggers[DEFAULT_LOGGER_NAME][key] === 'function') {
      output[key] = knownLoggers[DEFAULT_LOGGER_NAME][key].bind(knownLoggers[DEFAULT_LOGGER_NAME]);
    }
  }
  // Expose winston instance
  output.winston = winston;

  // Object configured, return it
  return output;
}

// Export the configured output function
module.exports = loggerFactory;
