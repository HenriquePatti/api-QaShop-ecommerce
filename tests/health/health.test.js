import { expect } from 'chai';
import request from 'supertest';

describe("health - API-QaShop", () => {
  it("deve retornar status code 200", async () => {
    const res = await request('http://localhost:3000')
      .get('/');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('health', '/health');
  })
})