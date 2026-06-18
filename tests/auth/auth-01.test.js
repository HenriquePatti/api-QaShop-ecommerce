import request from 'supertest';
import { expect } from 'chai';

const BASE_URL = 'http://localhost:3000';

describe('[AUTH-01] [POST /auth/register]: Campos obrigatórios no cadastro', () => {
  it('CT-01 - cadastro sem chave `name` - 400 VALIDATION_ERROR', async () => {
    const body = { email: 'ct01@test.com', password: 'Senha123' };
    const res = await request(BASE_URL)
      .post('/auth/register')
      .send(body);
    expect(res.status).to.equal(400);
    expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
    expect(res.body.error.details).to.have.property('fieldErrors');
    expect(res.body.error.details.fieldErrors.name).to.deep.equal(['Required']);
  })

  it('CT-02 - cadastro sem chave `email` - 400 VALIDATION_ERROR', async () => {
    const body = { name: 'Teste QA', password: 'Senha123' };
    const res = await request(BASE_URL)
      .post('/auth/register')
      .send(body);
    expect(res.status).to.equal(400);
    expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
    expect(res.body.error.details).to.have.property('fieldErrors');
    expect(res.body.error.details.fieldErrors.email).to.deep.equal(['Required']);
  })

  it('CT-03 - cadastro sem chave `password` - 400 VALIDATION_ERROR', async () => {
    const body = { name: 'Teste QA', email: 'ct03@test.com' };
    const res = await request(BASE_URL)
      .post('/auth/register')
      .send(body);
    expect(res.status).to.equal(400);
    expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
    expect(res.body.error.details).to.have.property('fieldErrors');
    expect(res.body.error.details.fieldErrors.password).to.deep.equal(['Required']);
  })

  it('CT-04 - cadastro com body `vazio` - 400 VALIDATION_ERROR', async () => {
    const body = {};
    const res = await request(BASE_URL)
      .post('/auth/register')
      .send(body);
    expect(res.status).to.equal(400);
    expect(res.body).to.have.nested.property('error.code', 'VALIDATION_ERROR');
    expect(res.body.error.details).to.have.property('fieldErrors');
    expect(res.body.error.details.fieldErrors.name).to.deep.equal(['Required']);
    expect(res.body.error.details.fieldErrors.email).to.deep.equal(['Required']);
    expect(res.body.error.details.fieldErrors.password).to.deep.equal(['Required']);
  })
})