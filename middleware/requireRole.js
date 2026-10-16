/**
 * Middleware factory that restricts access to users with specific roles.
 * Usage: requireRole('ADMIN') or requireRole('SERVICEPROV', 'ADMIN')
 * Must be used AFTER requireAuth.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'insufficient permissions' });
    }

    next();
  };
}
