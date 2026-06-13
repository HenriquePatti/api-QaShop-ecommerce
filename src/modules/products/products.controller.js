import * as service from './products.service.js';

export async function list(req, res) {
  res.json(await service.list(req.query));
}

export async function getBySlug(req, res) {
  res.json(await service.getBySlug(req.params.slug));
}

export async function getById(req, res) {
  res.json(await service.getById(req.params.id));
}

export async function getRelated(req, res) {
  res.json(await service.getRelatedProducts(req.params.slug, req.query.limit));
}

export async function create(req, res) {
  res.status(201).json(await service.create(req.body));
}

export async function update(req, res) {
  res.json(await service.update(req.params.id, req.body));
}

export async function remove(req, res) {
  const result = await service.remove(req.params.id);
  if (result) return res.status(200).json(result); // soft-deleted, returns the now-inactive product
  res.status(204).send();
}
