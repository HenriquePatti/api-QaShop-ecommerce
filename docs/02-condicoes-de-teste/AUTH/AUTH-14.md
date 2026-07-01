# Condições de teste — AUTH-14
> Baseado na ISO/IEC/IEEE 29119-3 (condições de teste).

> **Regra:** [AUTH-14 — Resposta genérica para credenciais inválidas](../../01-regras-de-negocio/regras-de-negocio.md#autenticacao-e-autorizacao) (`POST /auth/login`)

**Requisito testado:** AUTH-14 — e-mail inexistente **ou** senha incorreta retornam a **mesma** resposta genérica, sem distinguir os casos. Violação: `401` com `UNAUTHORIZED` ("Invalid credentials").

---

| ID      | Condição de teste                                                                                         | Prioridade |
| ------- | --------------------------------------------------------------------------------------------------------- | ---------- |
| COND-01 | `email` com formato válido **não cadastrado** (ex.: `naoexiste@test.com`) e `password` com mínimo de 1 caractere | Alta       |
| COND-02 | `email` de usuário **cadastrado** (ex.: `alice@test.com`) e `password` incorreta                          | Alta       |
| COND-03 | `email` que normaliza para usuário cadastrado (ex.: `Alice@Test.com`) e `password` incorreta              | Média      |

**regra:** em COND-01, COND-02 e COND-03 → HTTP `401`, `error.code` = `UNAUTHORIZED`, `error.message` = `Invalid credentials`; corpo **sem** `token` nem `user`. As respostas de COND-01 e COND-02 devem ser **indistinguíveis** (mesmo status, `code` e `message`).

---
