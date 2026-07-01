# Casos de teste — AUTH-14
> Baseado na ISO/IEC/IEEE 29119-3 (casos de teste).

> **Regra:** [AUTH-14 — Resposta genérica para credenciais inválidas](../../01-regras-de-negocio/regras-de-negocio.md#autenticacao-e-autorizacao) (`POST /auth/login`)

**Condições:** [AUTH-14](../02-condicoes-de-teste/AUTH/AUTH-14.md)

---

| ID    | Título                                                              | Prioridade | Condição |
| ----- | ------------------------------------------------------------------- | ---------- | -------- |
| CT-01 | Login com e-mail não cadastrado (ex.: `naoexiste@test.com`)         | Alta       | COND-01  |
| CT-02 | Login com e-mail cadastrado e senha incorreta (ex.: `alice@test.com`) | Alta       | COND-02  |
| CT-03 | Login com e-mail em maiúsculas equivalente ao cadastrado e senha incorreta (ex.: `Alice@Test.com`) | Média      | COND-03  |

**regra:** em todos os casos acima → HTTP `401`, `error.code` = `UNAUTHORIZED`, `error.message` = `Invalid credentials`; corpo **sem** `token` nem `user`. As respostas de CT-01 e CT-02 devem ser **indistinguíveis** (mesmo status, `code` e `message`).

---
