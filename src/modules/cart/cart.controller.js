import * as service from './cart.service.js';

export async function getCart(req, res) {
  res.json(await service.getCart(req.userId));
}

export async function addItem(req, res) {
  res.status(201).json(await service.addItem(req.userId, req.body));
}

export async function updateItem(req, res) {
  res.json(await service.updateItem(req.userId, req.params.productId, req.body));
}

export async function removeItem(req, res) {
  res.json(await service.removeItem(req.userId, req.params.productId));
}

export async function clearCart(req, res) {
  res.json(await service.clearCart(req.userId));
}
