# Condições de teste — AUTH-13
> Baseado na ISO/IEC/IEEE 29119-3 (condições de teste).

> **Regra:** [AUTH-13 — Campos obrigatórios no login](../../01-regras-de-negocio/regras-de-negocio.md#autenticacao-e-autorizacao) (`POST /auth/login`)

**Requisito testado:** AUTH-13 — `email` e `password` são obrigatórios; `email` deve ter formato válido. Violação: `400` com `VALIDATION_ERROR`.

---

| ID      | Condição de teste                                           | Prioridade |
| ------- | ----------------------------------------------------------- | ---------- |
| COND-01 | Body JSON sem chave `email` (com `password` válido)         | Alta       |
| COND-02 | Body JSON sem chave `password` (com `email` válido)         | Alta       |
| COND-03 | Body {}                                                     | Alta       |
| COND-04 | `email`: "" (com `password` válido)                         | Média      |
| COND-05 | `password`: "" (com `email` válido)                         | Média      |
| COND-06 | `email` com formato inválido (ex.: 'nao-email')             | Média      |

**regra:** em todas as violações acima → HTTP `400`, `error.code` = `VALIDATION_ERROR`, `details` (`fieldErrors` / `formErrors`)

---