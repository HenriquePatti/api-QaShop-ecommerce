import request from 'supertest';
import { BASE_URL } from '../config.js';
import { expect } from 'chai';

describe('[GEN-07] [GET /]: Health check', () => {
  it('deve retornar status code 200', async () => {
    const res = await request(BASE_URL).get('/');
    expect(res.status).to.equal(200);
  });
});