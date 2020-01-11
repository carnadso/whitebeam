const ignorePrivate = require('./ignore-private');
const removeSecrets = require('./remove-secrets');
const applicationLabel = require('./application-label');
const addPid = require('./add-pid');
const addContext = require('./add-context');
const simpleExtended = require('./simple-extended');
const stackTraceErrors = require('./stack-trace-errors');

module.exports = {
  ignorePrivate,
  removeSecrets,
  applicationLabel,
  addPid,
  addContext,
  simpleExtended,
  stackTraceErrors,
};
