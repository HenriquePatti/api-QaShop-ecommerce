import { register } from '../helpers/auth.js';
import { expect } from 'chai';

describe('[AUTH-08] [POST /auth/register]: Unicidade de e-mail', () => {
  const baseBody = { name: 'Auth-08 Alice', email: 'alice@test.com', password: 'Senha123' };
  
  it('CT-01 - cadastro com e-mail já cadastrado (ex.: alice@test.com)', async () => {
    const res = await register(baseBody);
    expect(res.status).to.equal(409);
    expect(res.body).to.have.nested.property('error.code', 'CONFLICT');
    expect(res.body).to.have.nested.property('error.message', 'Email already registered');
  })

  it('CT-02 - cadastro com e-mail em maiúsculas equivalente ao cadastrado', async () => {
    const body = { ...baseBody, email: 'aLiCe@test.com' };
    const res = await register(body);
    expect(res.status).to.equal(409);
    expect(res.body).to.have.nested.property('error.code', 'CONFLICT');
    expect(res.body).to.have.nested.property('error.message', 'Email already registered');
  })

  it('CT-03 - cadastro com e-mail com espaços que normaliza para cadastrado', async () => {
    const body = { ...baseBody, email: ' alice@test.com ' };
    const res = await register(body);
    expect(res.status).to.equal(409);
    expect(res.body).to.have.nested.property('error.code', 'CONFLICT');
    expect(res.body).to.have.nested.property('error.message', 'Email already registered');
  })
})