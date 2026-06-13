import * as authService from './auth.service.js';

export async function register(req, res) {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

export async function login(req, res) {
  const result = await authService.login(req.body);
  res.status(200).json(result);
}

export async function me(req, res) {
  const user = await authService.me(req.userId);
  res.status(200).json(user);
}
