import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token
 * @param {string} id - User MongoDB ObjectID
 * @param {string} role - User role (student, staff, admin)
 * @returns {string} Signed JWT token
 */
export const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET || 'campusfix_jwt_fallback_secret_key_2026';
  const expiresIn = process.env.JWT_EXPIRE || '30d';

  return jwt.sign({ id, role }, secret, {
    expiresIn,
  });
};

export default generateToken;
