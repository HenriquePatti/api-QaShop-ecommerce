import * as service from './users.service.js';
import { ForbiddenError } from '../../lib/errors.js';

export async function list(req, res) {
  const result = await service.list(req.query);
  res.json(result);
}

export async function getById(req, res) {
  // Admin OR self
  if (req.userRole !== 'ADMIN' && req.userId !== req.params.id) {
    throw new ForbiddenError('You can only access your own profile');
  }
  const user = await service.getById(req.params.id);
  res.json(user);
}

export async function update(req, res) {
  // Self can update self; admin can update anyone. role cannot be changed here (schema is strict).
  if (req.userRole !== 'ADMIN' && req.userId !== req.params.id) {
    throw new ForbiddenError('You can only update your own profile');
  }
  const user = await service.update(req.params.id, req.body);
  res.json(user);
}

export async function remove(req, res) {
  await service.remove(req.params.id);
  res.status(204).send();
}

export async function getMyStats(req, res) {
  res.json(await service.getMyStats(req.userId));
}
