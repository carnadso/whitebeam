const traverse = require('traverse');
const cloneDeep = require('clone-deep');
const { LEVEL } = require('triple-beam');
const { format } = require('logform');

/**
 * Replaces sensitive keys' values with the value '***REMOVED***'
 */
const removeSecrets = format((info) => {
  if (process.env.NODE_ENV === 'development') {
    return info;
  }

  // For base types, just return the object
  if (typeof info === 'undefined' || typeof info !== 'object') {
    return info;
  }

  // We clone the info object in order to not mutate the original
  const clonedInfo = cloneDeep(info);

  traverse(clonedInfo).forEach(function bodyTraverser(x) {
    if (!this.isLeaf || typeof x !== 'string') {
      return;
    }

    const lowerCasedKey = this.key.toLowerCase();
    if (lowerCasedKey.indexOf('secret') !== -1 || lowerCasedKey.indexOf('password') !== -1) {
      this.update('***REMOVED***');
    }
  });

  // 'level' is a Symbol, not a string property...
  // ...so therefore we have to copy it in a special manner
  clonedInfo[LEVEL] = info[LEVEL];

  return clonedInfo;
});

module.exports = removeSecrets;
