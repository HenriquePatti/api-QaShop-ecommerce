# Condições de teste — AUTH-08
> Baseado na ISO/IEC/IEEE 29119-3 (condições de teste).

> **Regra:** [AUTH-08 — Unicidade de e-mail: não pode existir outro usuário com o mesmo e-mail (comparação após normalização para minúsculas).](../../01-regras-de-negocio/regras-de-negocio.md#autenticacao-e-autorizacao) (`POST /auth/register`)

**Requisito testado:** AUTH-08 — não pode existir outro usuário com o mesmo e-mail (comparação após normalização). Violação: `409` com `error.code` = `CONFLICT`.

---

| ID      | Condição de teste                                                                                         | Prioridade |
| ------- | --------------------------------------------------------------------------------------------------------- | ---------- |
| COND-01 | Body JSON com `name`, `email` e `password` válidos (AUTH-02 a AUTH-07); `email` idêntico a usuário já cadastrado (ex.: `alice@test.com`) | Alta       |
| COND-02 | Body JSON com `name`, `email` e `password` válidos; `email` que normaliza para e-mail existente (ex.: `Alice@Test.com` ou ` alice@test.com `) | Alta       |

**regra:** em COND-01 e COND-02 → HTTP `409`, `error.code` = `CONFLICT`, `error.message` = `Email already registered`; nenhum novo usuário é criado.

---