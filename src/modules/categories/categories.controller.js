import * as service from './categories.service.js';

export async function listAll(_req, res) {
  res.json(await service.listAll());
}

export async function getBySlug(req, res) {
  res.json(await service.getBySlug(req.params.slug));
}

export async function create(req, res) {
  res.status(201).json(await service.create(req.body));
}

export async function update(req, res) {
  res.json(await service.update(req.params.id, req.body));
}

export async function remove(req, res) {
  await service.remove(req.params.id);
  res.status(204).send();
}
