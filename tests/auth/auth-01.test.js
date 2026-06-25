import { register } from '../helpers/auth.js';
import { expect } from 'chai';

describe('[AUTH-01] [POST /auth/register]: Campos obrigatórios no cadastro', () => {
  it('CT-01 - cadastro sem chave `name` - 400 VALIDATION_ERROR', async () => {
    const body = { email: 'ct01@test.com', password: 'Senha123' };
    const res = await register(body);
    expect(res.status).to.equal(400);
    expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
    expect(res.body.error.details).to.have.property('fieldErrors');
    expect(res.body.error.details.fieldErrors.name).to.deep.equal(['Required']);
  })

  it('CT-02 - cadastro sem chave `email` - 400 VALIDATION_ERROR', async () => {
    const body = { name: 'Teste QA', password: 'Senha123' };
    const res = await register(body);
    expect(res.status).to.equal(400);
    expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
    expect(res.body.error.details).to.have.property('fieldErrors');
    expect(res.body.error.details.fieldErrors.email).to.deep.equal(['Required']);
  })

  it('CT-03 - cadastro sem chave `password` - 400 VALIDATION_ERROR', async () => {
    const body = { name: 'Teste QA', email: 'ct03@test.com' };
    const res = await register(body);
    expect(res.status).to.equal(400);
    expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
    expect(res.body.error.details).to.have.property('fieldErrors');
    expect(res.body.error.details.fieldErrors.password).to.deep.equal(['Required']);
  })

  it('CT-04 - cadastro com body `vazio` - 400 VALIDATION_ERROR', async () => {
    const body = {};
    const res = await register(body);
    expect(res.status).to.equal(400);
    expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
    expect(res.body.error.details).to.have.property('fieldErrors');
    expect(res.body.error.details.fieldErrors.name).to.deep.equal(['Required']);
    expect(res.body.error.details.fieldErrors.email).to.deep.equal(['Required']);
    expect(res.body.error.details.fieldErrors.password).to.deep.equal(['Required']);
  })

  it('CT-05 - cadastro com `name` vazio - 400 VALIDATION_ERROR', async () => {
    const body = { name: '', email: 'ct05@test.com', password: 'Senha123' };
    const res = await register(body);
    expect(res.status).to.equal(400);
    expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
    expect(res.body.error.details).to.have.property('fieldErrors');
    expect(res.body.error.details.fieldErrors.email).to.be.undefined;
    expect(res.body.error.details.fieldErrors.password).to.be.undefined;
    expect(res.body.error.details.fieldErrors.name).to.deep.equal(['Name is required']);
  })

  it('CT-06 - cadastro com `email` vazio - 400 VALIDATION_ERROR', async () => {
    const body = { name: 'Teste 06', email: '', password: 'Senha123' };
    const res = await register(body);
    expect(res.status).to.equal(400);
    expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
    expect(res.body.error.details).to.have.property('fieldErrors');
    expect(res.body.error.details.fieldErrors.name).to.be.undefined;
    expect(res.body.error.details.fieldErrors.password).to.be.undefined;
    expect(res.body.error.details.fieldErrors.email).to.deep.equal(['Invalid email']);
  })

  it('CT-07 - cadastro com `password` vazio - 400 VALIDATION_ERROR', async () => {
    const body = { name: 'Teste 07', email: 'ct07@test.com', password: '' };
    const res = await register(body);
    expect(res.status).to.equal(400);
    expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
    expect(res.body.error.details).to.have.property('fieldErrors');
    expect(res.body.error.details.fieldErrors.name).to.be.undefined;
    expect(res.body.error.details.fieldErrors.email).to.be.undefined;
    expect(res.body.error.details.fieldErrors.password).to.deep.equal([
      'Password must be at least 8 characters',
      'Password must contain at least 1 uppercase letter',
      'Password must contain at least 1 number']
    );
  })
})