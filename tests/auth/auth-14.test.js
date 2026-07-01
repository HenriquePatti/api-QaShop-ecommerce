import { login } from '../helpers/auth.js';
import { expect } from 'chai';

describe('[AUTH-14] [POST /auth/login]: Resposta genérica para credenciais inválidas', ()=> {
  const baseBody = { email: 'alice@test.com', password: '123456' };

  it('CT-01 - login com e-mail não cadastrado (ex.: `naoexiste@test.com`)', async ()=> {
    const body = { ...baseBody, email: 'naoexiste@test.com' };
    const res = await login(body)
      expect(res.status).to.equal(401);
      expect(res.body).to.have.nested.property('error.code', 'UNAUTHORIZED');
      expect(res.body).to.have.nested.property('error.message', 'Invalid credentials');
      expect(res.body).to.not.have.property('token');
      expect(res.body).to.not.have.property('user');
  })

  it('CT-02 - login com e-mail cadastrado e senha incorreta (ex.: `alice@test.com`)', async ()=> {
    const body = { ...baseBody, password: 'invalidPassword' };
    const res = await login(body)
      expect(res.status).to.equal(401);
      expect(res.body).to.have.nested.property('error.code', 'UNAUTHORIZED');
      expect(res.body).to.have.nested.property('error.message', 'Invalid credentials');
      expect(res.body).to.not.have.property('token');
      expect(res.body).to.not.have.property('user');
  })

  it('CT-03 - login com e-mail em maiúsculas equivalente ao cadastrado e senha incorreta (ex.: `Alice@Test.com`)', async ()=> {
    const body = { ...baseBody, email: 'Alice@Test.coms', password: 'invalidPassword' };
    const res = await login(body)
      expect(res.status).to.equal(401);
      expect(res.body).to.have.nested.property('error.code', 'UNAUTHORIZED');
      expect(res.body).to.have.nested.property('error.message', 'Invalid credentials');
      expect(res.body).to.not.have.property('token');
      expect(res.body).to.not.have.property('user');
  })
})