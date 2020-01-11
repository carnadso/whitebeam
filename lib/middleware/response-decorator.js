const domain = require('domain');
const crypto = require('crypto');

const shortUuid = require('../helpers/short-uuid');
const getIp = require('../helpers/get-ip');

function responseDecoratorFactory(opts = { headersPrefix: 'X-Whitebeam-' }) {
  return (req, res, next) => {
    // Make sure we cover all spellings for referrer
    const referrer = req.headers.referrer || req.headers.referer || '';
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    // Page visit ID
    // In case of normal requests, a hash of the device ID and the original request URL
    // In case of XHR requests, a hash of the device ID and the referrer URL (because we
    // are 'on the same page')
    const userId = (req.user && (req.user.user_id || req.user.site_user_id || req.user.id)) || '';
    const requestIp = getIp(req);
    const requestUrl = req.xhr ? referrer : fullUrl;

    const requestPageViewId = crypto.createHash('md5').update(`${userId}${requestIp}${requestUrl}`).digest('hex');
    const requestUuid = shortUuid(true);
    const requestUserId = (req.user && req.user.user_id) || (req.user && req.user.site_user_id) || '';

    res.logContext = Object.assign(res.logContext || {}, {
      ruid: requestUuid,
      pvid: requestPageViewId,
      http_method: req.method,
      http_path: req.path,
      sid: req.sessionID || '',
      uid: requestUserId || '',
      pid: process.pid,
    });

    if (domain.active) {
      domain.active.logContext = Object.assign(domain.active.logContext || {}, res.logContext);
    }

    // Also add the response headers so that we can log it in NGINX
    if (typeof opts.headersPrefix === 'string') {
      Object.entries(res.logContext, ([key, val]) => {
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          res.set(`${opts.headersPrefix}${key}`, val);
        }
      });
    }

    return next();
  };
}

module.exports = responseDecoratorFactory;
