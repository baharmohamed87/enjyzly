import jwt from 'jsonwebtoken';

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  return jwt.sign({ id: user.id }, secret, { expiresIn: '7d' });
}
