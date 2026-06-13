# Condições de teste — AUTH-01
> Baseado na ISO/IEC/IEEE 29119-3 (condições de teste).

> **Regra:** [AUTH-01 — Campos obrigatórios no cadastro](../../01-regras-de-negocio/regras-de-negocio.md#autenticacao-e-autorizacao) (`POST /auth/register`)

**Requisito testado:** AUTH-01 — `name`, `email` e `password` são obrigatórios. Violação: `400` com `VALIDATION_ERROR`.

---

| ID      | Condição de teste                                                   | Prioridade |
| ------- | ------------------------------------------------------------------- | ---------- |
| COND-01 | Body JSON **sem** a chave `name` (com `email` e `password` válidos) | Alta       |
| COND-02 | Body JSON **sem** a chave `email` (com `name` e `password` válidos) | Alta       |
| COND-03 | Body JSON **sem** a chave `password` (com `name` e `email` válidos) | Alta       |
| COND-04 | Body `{}` — ausência dos três campos obrigatórios                   | Alta       |
| COND-05 | Campo presente com valor vazio: `name: ""` (demais campos válidos)  | Média      |
| COND-06 | Campo presente com valor vazio: `email: ""`                         | Média      |
| COND-07 | Campo presente com valor vazio: `password: ""`                      | Média      |

**regra:** em todas as violações acima → HTTP `400`, `error.code` = `VALIDATION_ERROR`, `details` no formato Zod (`fieldErrors` / `formErrors`).

---
