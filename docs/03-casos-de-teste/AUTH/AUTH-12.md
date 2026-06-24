# Casos de teste — AUTH-12
> Baseado na ISO/IEC/IEEE 29119-3 (casos de teste).

> **Regra:** [AUTH-12 — Resposta de sucesso](../../01-regras-de-negocio/regras-de-negocio.md#autenticacao-e-autorizacao) (`POST /auth/register`)

**Condições:** [AUTH-12](../02-condicoes-de-teste/AUTH/AUTH-12.md)

---

| ID    | Título                                              | Prioridade | Condição |
| ----- | --------------------------------------------------- | ---------- | -------- |
| CT-01 | Cadastro válido → 201 com token e user sem password | Alta       | COND-01  |

**regra:** em CT-01 → HTTP `201`, `error` ausente; corpo `{ token, user }`; `user` não contém `password`; `token` JWT não vazio.

---