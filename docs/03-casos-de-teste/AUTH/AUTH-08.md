# Casos de teste — AUTH-08
> Baseado na ISO/IEC/IEEE 29119-3 (casos de teste).

> **Regra:** [AUTH-08 — Unicidade de e-mail](../../01-regras-de-negocio/regras-de-negocio.md#autenticacao-e-autorizacao) (`POST /auth/register`)

**Condições:** [AUTH-08](../02-condicoes-de-teste/AUTH/AUTH-08.md)

---

| ID    | Título                                                              | Prioridade | Condição |
| ----- | ------------------------------------------------------------------- | ---------- | -------- |
| CT-01 | Cadastro com e-mail já cadastrado (ex.: `alice@test.com`)           | Alta       | COND-01  |
| CT-02 | Cadastro com e-mail em maiúsculas equivalente ao cadastrado       | Alta       | COND-02  |
| CT-03 | Cadastro com e-mail com espaços que normaliza para cadastrado     | Alta       | COND-02  |

**regra:** em todos os casos acima → HTTP `409`, `error.code` = `CONFLICT`, `error.message` = `Email already registered`; nenhum novo usuário é criado.

---