import { register, login } from '../helpers/auth.js';
import { expect } from 'chai';

const email = `auth15_${Date.now()}@test.local`;
const baseBody = { name: 'Contoso-auth-15', email: email, 'password': 'Senha123' };

before(async ()=> {
  const res = await register(baseBody);
    expect(res.status).to.equal(201);
    expect(res.body.user).to.include({ email: email, role: 'CUSTOMER' });
})

describe('[AUTH-15] [POST /auth/login]: Sucesso no login', ()=> {
  it(`CT-01 - login válido → 200 com token e user sem password (ex.: ${email})`, async ()=> {
    const body = { email: email, password: baseBody.password };
    const res = await login(body);
      expect(res.status).to.equal(200);
      expect(res.body).to.not.have.property('error');
      expect(res.body.token).to.not.be.empty;
      expect(res.body.token.split('.')).to.have.lengthOf(3);
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.not.have.property('password');
      expect(res.body.user).to.include({ email: email, role: 'CUSTOMER' });  
  })

  const body = { ...baseBody, email: email.toUpperCase() };
  it(`CT-02 - login com e-mail em maiúsculas equivalente ao cadastrado e senha correta (ex.: ${body.email})`, async ()=> {
    const res = await login(body);
      expect(res.status).to.equal(200);
      expect(res.body).to.not.have.property('error');
      expect(res.body.token).to.not.be.empty;
      expect(res.body.token.split('.')).to.have.lengthOf(3);
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.not.have.property('password');
      expect(res.body.user).to.include({ email: email, role: 'CUSTOMER' });
  })
})