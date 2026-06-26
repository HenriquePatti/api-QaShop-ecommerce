import { login } from '../helpers/auth.js';
import { expect } from 'chai';

const PASSWORD = 'Alice@123';

describe('[AUTH-13] [POST /auth/login]: Campos obrigatórios no login', () => {
  it('CT-01 - login sem chave `email` - 400 VALIDATION_ERROR', async () => {
    const body = { password: PASSWORD };
    const res = await login(body);
    expect(res.status).to.equal(400);
    expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
    expect(res.body).to.have.nested.property('error.message', 'Request validation failed');
    expect(res.body.error.details).to.have.property('fieldErrors');
    expect(res.body.error.details.fieldErrors.email).to.deep.equal(['Required']);
  })

  it('CT-02 - login sem chave `password` - 400 VALIDATION_ERROR', async () => {
    const body = { email: 'ct13-02@test.com' };
    const res = await login(body);
      expect(res.status).to.equal(400);
      expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
      expect(res.body).to.have.nested.property('error.message', 'Request validation failed');
      expect(res.body.error.details).to.have.property('fieldErrors');
      expect(res.body.error.details.fieldErrors.password).to.deep.equal(['Required']);
  })

  it('CT-03 - login com body vazio `{}` - 400 VALIDATION_ERROR', async () => {
    const body = {};
    const res = await login(body);
      expect(res.status).to.equal(400);
      expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
      expect(res.body).to.have.nested.property('error.message', 'Request validation failed');
      expect(res.body.error.details).to.have.property('fieldErrors');
      expect(res.body.error.details.fieldErrors.email).to.deep.equal(['Required']);
      expect(res.body.error.details.fieldErrors.password).to.deep.equal(['Required']);
  })

  it('CT-04 - login com `email` vazio - 400 VALIDATION_ERROR', async () => {
    const body = { email: '', password: PASSWORD };
    const res = await login(body);
      expect(res.status).to.equal(400);
      expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
      expect(res.body).to.have.nested.property('error.message', 'Request validation failed');
      expect(res.body.error.details).to.have.property('fieldErrors');
      expect(res.body.error.details.fieldErrors.email).to.deep.equal(['Invalid email']);
  })

  it('CT-05 - login com `password` vazio - 400 VALIDATION_ERROR', async () => {
    const body = { email: 'ct13-02@test.com', password: '' };
    const res = await login(body);
      expect(res.status).to.equal(400);
      expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
      expect(res.body).to.have.nested.property('error.message', 'Request validation failed');
      expect(res.body.error.details).to.have.property('fieldErrors');
      expect(res.body.error.details.fieldErrors.password).to.deep.equal(['Password is required']);
  })

  it('CT-06 - login com `email` inválido - 400 VALIDATION_ERROR', async () => {
    const body = { email: 'nao-email', password: PASSWORD };
    const res = await login(body);
      expect(res.status).to.equal(400);
      expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
      expect(res.body).to.have.nested.property('error.message', 'Request validation failed');
      expect(res.body.error.details).to.have.property('fieldErrors');
      expect(res.body.error.details.fieldErrors.email).to.deep.equal(['Invalid email']);
  })
})