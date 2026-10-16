import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { publicUser, signToken } from '../lib/auth.js';

export async function register(req, res) {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'password must be at least 8 characters' });
  }

  try {
    const hashpassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, hashpassword },
    });

    return res.status(201).json({
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002') {
      return res.status(409).json({ error: 'email already registered' });
    }
    throw err;
  }
}

export async function login(req, res) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'invalid email or password' });
  }

  const ok = await bcrypt.compare(password, user.hashpassword);
  if (!ok) {
    return res.status(401).json({ error: 'invalid email or password' });
  }

  return res.json({
    token: signToken(user),
    user: publicUser(user),
  });
}
