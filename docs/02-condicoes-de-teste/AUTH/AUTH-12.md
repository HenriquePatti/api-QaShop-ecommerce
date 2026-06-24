# Condições de teste — AUTH-12
> Baseado na ISO/IEC/IEEE 29119-3 (condições de teste).

> **Regra:** [AUTH-12 — Resposta de sucesso: 201 com { token, user }, onde user não contém o campo password.](../../01-regras-de-negocio/regras-de-negocio.md#autenticacao-e-autorizacao) (`POST /auth/register`)

**Requisito testado:** AUTH-12 — cadastro válido retorna `201` com `{ token, user }`; `user` não contém o campo `password`.

---

| ID      | Condição de teste                                                                 | Prioridade |
| ------- | --------------------------------------------------------------------------------- | ---------- |
| COND-01 | Body JSON com `name`, `email` e `password` válidos (AUTH-02 a AUTH-06); e-mail ainda não cadastrado (AUTH-08) | Alta       |

**regra:** em COND-01 → HTTP `201`, corpo `{ token, user }`; `user` não contém `password`; `token` é JWT não vazio.

---