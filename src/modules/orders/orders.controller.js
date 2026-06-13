import * as service from './orders.service.js';

function requester(req) {
  return { id: req.userId, role: req.userRole };
}

export async function list(req, res) {
  res.json(await service.list(req.query, requester(req)));
}

export async function getById(req, res) {
  res.json(await service.getById(req.params.id, requester(req)));
}

export async function create(req, res) {
  res.status(201).json(await service.createFromCart(req.userId, req.body));
}

export async function pay(req, res) {
  res.json(await service.pay(req.params.id, requester(req)));
}

export async function ship(req, res) {
  res.json(await service.ship(req.params.id, requester(req)));
}

export async function deliver(req, res) {
  res.json(await service.deliver(req.params.id, requester(req)));
}

export async function cancel(req, res) {
  res.json(await service.cancel(req.params.id, requester(req)));
}
