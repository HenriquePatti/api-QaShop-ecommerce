# Casos de teste — AUTH-01
> Baseado na ISO/IEC/IEEE 29119-3 (casos de teste).

> **Regra:** [AUTH-01 — Campos obrigatórios no cadastro](../../01-regras-de-negocio/regras-de-negocio.md#autenticacao-e-autorizacao) (`POST /auth/register`)

**Condições:** [AUTH-01](../02-condicoes-de-teste/AUTH/AUTH-01.md)

---

| ID    | Título                              | Prioridade | Condição |
| ----- | ----------------------------------- | ---------- | -------- |
| CT-01 | Cadastro sem chave `name`           | Alta       | COND-01  |
| CT-02 | Cadastro sem chave `email`          | Alta       | COND-02  |
| CT-03 | Cadastro sem chave `password`       | Alta       | COND-03  |
| CT-04 | Cadastro com body vazio (`{}`)      | Alta       | COND-04  |
| CT-05 | Cadastro com `name` vazio           | Média      | COND-05  |
| CT-06 | Cadastro com `email` vazio          | Média      | COND-06  |
| CT-07 | Cadastro com `password` vazio       | Média      | COND-07  |

**regra:** em todos os casos acima → HTTP `400`, `error.code` = `VALIDATION_ERROR`, `details` no formato Zod (`fieldErrors` / `formErrors`).

---
