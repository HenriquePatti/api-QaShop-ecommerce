import * as service from './reviews.service.js';

function requester(req) {
  return { id: req.userId, role: req.userRole };
}

export async function listForProduct(req, res) {
  res.json(await service.listForProduct(req.params.productId, req.query));
}

export async function create(req, res) {
  res.status(201).json(await service.create(req.userId, req.params.productId, req.body));
}

export async function update(req, res) {
  res.json(await service.update(req.params.id, requester(req), req.body));
}

export async function remove(req, res) {
  await service.remove(req.params.id, requester(req));
  res.status(204).send();
}
