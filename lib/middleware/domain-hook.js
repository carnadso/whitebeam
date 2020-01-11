const domain = require('domain');

function domainHookFactory() {
  return (req, res, next) => {
    // Already within a domain, continue
    if (domain.active) {
      return next();
    }

    const d = domain.create();

    d.add(req);
    d.add(res);

    res.on('finish', () => {
      if (domain.active) {
        domain.active.exit();
      }
    });

    res.on('close', () => {
      if (domain.active) {
        domain.active.exit();
      }
    });

    return d.run(next);
  };
}

module.exports = domainHookFactory;
