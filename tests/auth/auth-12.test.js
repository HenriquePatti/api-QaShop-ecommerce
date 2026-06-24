import request from 'supertest';
import { expect } from 'chai';

const BASE_URL = 'http://localhost:3000';

describe('[AUTH-12] [POST /auth/register]: Resposta de sucesso', () => {
  it('CT-01 - cadastro válido → 201 com token e user sem password', async () => {
    const email = `auth12_${Date.now()}@test.local`;
    const body = { name: 'Carol', email: email, 'password': 'Senha123' };

    const res = await request(BASE_URL)
      .post('/auth/register')
      .send(body);
    expect(res.status).to.equal(201);
    expect(res.body.token).to.not.be.empty;

    const partes = res.body.token.split('.');
    expect(partes.length).to.equal(3);

    expect(res.body).to.have.property('user');
    expect(res.body.user).to.not.have.property('password');
    expect(res.body.user).to.include({ email, role: 'CUSTOMER' });
  })
})
