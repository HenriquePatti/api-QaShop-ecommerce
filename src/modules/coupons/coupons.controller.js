import * as service from './coupons.service.js';

export async function listAll(_req, res) {
  res.json(await service.listAll());
}

export async function create(req, res) {
  res.status(201).json(await service.create(req.body));
}

export async function update(req, res) {
  res.json(await service.update(req.params.id, req.body));
}

export async function remove(req, res) {
  const result = await service.remove(req.params.id);
  if (result) return res.status(200).json(result);
  res.status(204).send();
}

export async function validate(req, res) {
  const { code, orderValue } = req.body;
  const result = await service.evaluateCoupon({ code, userId: req.userId, orderValue });
  // Strip the internal coupon row from the response — keep the API surface tight.
  const { coupon: _c, reasonCode: _rc, ...payload } = result;
  res.json(payload);
}
