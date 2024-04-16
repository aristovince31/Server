const { createSign, verifySign } = require("../services/auth");

async function loggedInUser(req, res, next) {
    if (req.cookies && req.cookies.uuid){
      let user = await verifySign(req.cookies.uuid);
      if (user) {
        delete user.iat;
        delete user.exp;
        req.user = user;
      }
      else
      {
        res.status(400).json({});
      }
    }
    next();
}

function restrictAccess(authorizedRoles) {
  return (req, res, next) => {
    if (!authorizedRoles.includes(req.user.loginType)) {
      res.status(403).json({});
      return;
    }
    next(req, res, next);
  };
}

module.exports = loggedInUser;
