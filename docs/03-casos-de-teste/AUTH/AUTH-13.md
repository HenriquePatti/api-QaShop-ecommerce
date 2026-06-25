# Casos de teste — AUTH-13
> Baseado na ISO/IEC/IEEE 29119-3 (casos de teste).

> **Regra:** [AUTH-13 — Campos obrigatórios no login](../../01-regras-de-negocio/regras-de-negocio.md#autenticacao-e-autorizacao) (`POST /auth/login`)

**Condições:** [AUTH-13](../02-condicoes-de-teste/AUTH/AUTH-13.md)

---

| ID    | Título                              | Prioridade | Condição |
| ----- | ----------------------------------- | ---------- | -------- |
| CT-01 | Login sem chave `email`             | Alta       | COND-01  |
| CT-02 | Login sem chave `password`          | Alta       | COND-02  |
| CT-03 | Login com body vazio (`{}`)         | Alta       | COND-03  |
| CT-04 | Login com `email` vazio             | Média      | COND-04  |
| CT-05 | Login com `password` vazio          | Média      | COND-05  |
| CT-06 | Login com `email` inválido          | Média      | COND-06  |

**regra:** em todos os casos acima → HTTP `400`, `error.code` = `VALIDATION_ERROR`, `details` (`fieldErrors` / `formErrors`).

---
