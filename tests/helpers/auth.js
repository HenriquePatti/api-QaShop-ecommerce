import request from 'supertest';
import { BASE_URL, REGISTER_ENDPOINT, LOGIN_ENDPOINT } from '../config.js';

export function register(body) {
  return request(BASE_URL).post(REGISTER_ENDPOINT).send(body);
}

export function login(body) {
  return request(BASE_URL).post(LOGIN_ENDPOINT).send(body);
}