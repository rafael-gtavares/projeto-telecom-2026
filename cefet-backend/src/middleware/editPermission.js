const { ROLES } = require('../constants/roles');
const User = require('../models/User');

const verifyEditPermission = async (req, res, next) => {
  try {
    if (req.user.role !== ROLES.STUDENT) return next();

    const editingSensitiveFields =
      req.body.name !== undefined ||
      req.body.birthDate !== undefined;

    if (!editingSensitiveFields) return next();

    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    if (currentUser.canEditPersonalInfo) return next();

    return res.status(403).json({
      message: 'Você não possui permissão para alterar esses dados.'
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
    verifyEditPermission
};