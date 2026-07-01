# Casos de teste — AUTH-15
> Baseado na ISO/IEC/IEEE 29119-3 (casos de teste).

> **Regra:** [AUTH-15 — Sucesso no login](../../01-regras-de-negocio/regras-de-negocio.md#autenticacao-e-autorizacao) (`POST /auth/login`)

**Condições:** [AUTH-15](../02-condicoes-de-teste/AUTH/AUTH-15.md)

---

| ID    | Título                                                              | Prioridade | Condição |
| ----- | ------------------------------------------------------------------- | ---------- | -------- |
| CT-01 | Login válido → 200 com token e user sem password (ex.: `alice@test.com`) | Alta       | COND-01  |
| CT-02 | Login com e-mail em maiúsculas equivalente ao cadastrado e senha correta (ex.: `Alice@Test.com`) | Média      | COND-02  |

**regra:** em CT-01 e CT-02 → HTTP `200`, `error` ausente; corpo `{ token, user }`; `user` não contém `password`; `token` JWT não vazio; `user.email` reflete o e-mail normalizado do cadastro (ex.: `alice@test.com`).

---
