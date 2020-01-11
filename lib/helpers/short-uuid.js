const uuid = require('uuid');

/**
 * Created a short UUID by Base64 encoding it and replacing + with - and / with _
 * @param {boolean} [v1] Should be truthy if the requested UUID should be of v1 format ;
 *                     otherwise v4 is used
 * @returns string
 */
function create(v1) {
  const buf = Buffer.alloc(16);
  if (v1) {
    uuid.v1(null, buf, 0);
  } else {
    uuid.v4(null, buf, 0);
  }
  // We remove the trailing '==', replace '+' with '_' and '/' with '-'
  return buf.toString('base64').replace(/==$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

module.exports = create;
