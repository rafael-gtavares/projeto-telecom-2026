const { ROLE_HIERARCHY } = require('../constants/roles')

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ success: false, message: 'Acesso negado: permissão insuficiente' });
  next();
};

const requireMinimumRole = (minimumRole) => {
    return (req, res, next) => {

        if (
            ROLE_HIERARCHY[req.user.role] <
            ROLE_HIERARCHY[minimumRole]
        ) {
            return res.status(403).json({
                success: false,
                message: "Sem permissão."
            });
        }

        next();
    };
};

module.exports = {
  requireRole,
  requireMinimumRole
};
