import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { ConflictError, UnauthorizedError } from '../../lib/errors.js';
import { sanitizeUser } from '../../lib/sanitize.js';

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export async function register({ name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError('Email already registered');

  const hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { name, email, password: hash, role: 'CUSTOMER', cart: { create: {} } },
  });

  const token = signToken(user);
  return { token, user: sanitizeUser(user) };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedError('Invalid credentials');

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new UnauthorizedError('Invalid credentials');

  const token = signToken(user);
  return { token, user: sanitizeUser(user) };
}

export async function me(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedError('User no longer exists');
  return sanitizeUser(user);
}
