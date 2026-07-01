# Condições de teste — AUTH-15
> Baseado na ISO/IEC/IEEE 29119-3 (condições de teste).

> **Regra:** [AUTH-15 — Sucesso retorna 200 com { token, user } (sem password)](../../01-regras-de-negocio/regras-de-negocio.md#autenticacao-e-autorizacao) (`POST /auth/login`)

**Requisito testado:** AUTH-15 — login com credenciais válidas retorna `200` com `{ token, user }`; `user` não contém o campo `password`.

---

| ID      | Condição de teste                                                                                         | Prioridade |
| ------- | --------------------------------------------------------------------------------------------------------- | ---------- |
| COND-01 | `email` e `password` válidos de usuário **cadastrado** (ex.: `alice@test.com` / `Alice@123` do seed)      | Alta       |
| COND-02 | `email` que normaliza para usuário cadastrado (ex.: `Alice@Test.com`) e `password` correta                | Média      |

**regra:** em COND-01 e COND-02 → HTTP `200`, `error` ausente; corpo `{ token, user }`; `user` não contém `password`; `token` é JWT não vazio.

---
