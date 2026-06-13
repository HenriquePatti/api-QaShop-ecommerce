# Regras de Negócio — API de E-commerce (QA)

Este documento descreve **todas as regras de negócio realmente implementadas** na API de e-commerce, extraídas diretamente do código-fonte (modelos Prisma, middlewares, schemas Zod e services de cada módulo). Ele serve de base para o Analista de QA escrever casos de teste: cada regra é numerada (ex.: `AUTH-01`) para permitir rastreabilidade. Sempre que o `README.md` ou o Swagger divergem do código, **o comportamento documentado aqui é o do código**. Regras esperadas mas não implementadas estão isoladas na seção [Observações](#observacoes).

> Base de código analisada: `prisma/schema.prisma`, `src/middlewares/*`, `src/lib/*`, `src/modules/**` e `prisma/seed.js`.

**Autor:** [Henrique Patti](https://www.linkedin.com/in/henrique-patti/)

---

## Índice

1. [Convenções gerais](#convencoes-gerais)
2. [Autenticação e autorização](#autenticacao-e-autorizacao)
3. [Usuários](#usuarios)
4. [Categorias](#categorias)
5. [Produtos](#produtos)
6. [Carrinho](#carrinho)
7. [Cupons](#cupons)
8. [Pedidos](#pedidos)
9. [Avaliações (Reviews)](#avaliacoes)
10. [Paginação](#paginacao)
11. [Códigos de erro](#codigos-de-erro)
12. [Estado inicial do banco (seed)](#estado-inicial)
13. [Observações](#observacoes)

---

<a name="convencoes-gerais"></a>
## 1. Convenções gerais

| Código | Regra | Detalhe |
|---|---|---|
| GEN-01 | Formato padrão de erro | Toda resposta de erro tem o corpo `{ "error": { "code", "message", "details? } }`. O campo `details` só aparece quando há detalhes. |
| GEN-02 | Erros de validação Zod | Qualquer falha de schema Zod (body, params ou query) retorna `400` com `code: VALIDATION_ERROR` e `details` no formato `err.flatten()` (objeto `{ formErrors, fieldErrors }`). Aplica-se a TODOS os endpoints que usam o middleware `validate`. |
| GEN-03 | JSON malformado | Corpo JSON inválido retorna `400` com `code: VALIDATION_ERROR` e mensagem "Malformed JSON body". |
| GEN-04 | Limite de tamanho do corpo | O `express.json` aceita no máximo `1mb` de payload. |
| GEN-05 | Rota inexistente | Qualquer rota não mapeada retorna `404` com `code: NOT_FOUND` e mensagem `Route <MÉTODO> <URL> not found`. |
| GEN-06 | Erro inesperado | Erros não tratados retornam `500` com `code: INTERNAL_ERROR`. Em `NODE_ENV=production` a mensagem é genérica ("Internal server error"); fora de produção a mensagem real do erro é exposta. |
| GEN-07 | Health check | `GET /health` é público e retorna `{ status: "ok", uptime, timestamp }`. |
| GEN-08 | Documentação | `GET /api/docs` (Swagger UI) e `GET /api/docs.json` (spec OpenAPI) são públicos. `GET /` retorna metadados da API. |
| GEN-09 | Coerção de dados validados | Valores parseados pelo Zod são reescritos em `req.body`/`req.params`/`req.query`; handlers downstream recebem dados já normalizados (ex.: e-mail em minúsculas, strings com `trim`). |

---

<a name="autenticacao-e-autorizacao"></a>
## 2. Autenticação e autorização

### 2.1 Cadastro (`POST /auth/register`) — público

| Código | Regra | Violação |
|---|---|---|
| AUTH-01 | Campos obrigatórios: `name`, `email`, `password`. | `400 VALIDATION_ERROR` |
| AUTH-02 | `name`: string, após `trim` mínimo de 1 caractere, máximo de 100. | `400 VALIDATION_ERROR` |
| AUTH-03 | `email`: deve ter formato de e-mail válido. É normalizado com `trim` e convertido para minúsculas antes de gravar. | `400 VALIDATION_ERROR` |
| AUTH-04 | `password`: mínimo de **8 caracteres**. | `400 VALIDATION_ERROR` ("Password must be at least 8 characters") |
| AUTH-05 | `password`: deve conter **pelo menos 1 letra maiúscula** (regex `/[A-Z]/`). | `400 VALIDATION_ERROR` |
| AUTH-06 | `password`: deve conter **pelo menos 1 número** (regex `/[0-9]/`). | `400 VALIDATION_ERROR` |
| AUTH-07 | Não há exigência de caractere especial nem de letra minúscula. Senha de exatamente 8 caracteres com 1 maiúscula e 1 número é válida. | — |
| AUTH-08 | **Unicidade de e-mail**: não pode existir outro usuário com o mesmo e-mail (comparação após normalização para minúsculas). | `409 CONFLICT` ("Email already registered") |
| AUTH-09 | Todo cadastro cria um usuário com `role: "CUSTOMER"` — não é possível cadastrar um ADMIN por este endpoint. | — |
| AUTH-10 | No cadastro, um `Cart` vazio é criado automaticamente para o usuário. | — |
| AUTH-11 | A senha é gravada como hash bcrypt (custo `BCRYPT_ROUNDS`, padrão 10). O hash nunca é retornado em nenhuma resposta. | — |
| AUTH-12 | Resposta de sucesso: `201` com `{ token, user }`, onde `user` não contém o campo `password`. |  — |

### 2.2 Login (`POST /auth/login`) — público

| Código | Regra | Violação |
|---|---|---|
| AUTH-13 | Campos obrigatórios: `email` (formato válido, normalizado) e `password` (string com mínimo de 1 caractere). | `400 VALIDATION_ERROR` |
| AUTH-14 | E-mail inexistente OU senha incorreta retornam a **mesma** resposta genérica, sem distinguir os casos. | `401 UNAUTHORIZED` ("Invalid credentials") |
| AUTH-15 | Sucesso retorna `200` com `{ token, user }` (sem `password`). | — |

### 2.3 Token JWT

| Código | Regra | Violação |
|---|---|---|
| AUTH-16 | O JWT contém `sub` (id do usuário), `role` e `email`. É assinado com `JWT_SECRET`. | — |
| AUTH-17 | Validade do token: definida por `JWT_EXPIRES_IN` (**padrão `1h`**). | — |
| AUTH-18 | O header `Authorization` deve ter o formato `Bearer <token>`. Header ausente ou esquema diferente de `bearer` (case-insensitive). | `401 UNAUTHORIZED` ("Missing or malformed Authorization header") |
| AUTH-19 | Token expirado. | `401 UNAUTHORIZED` ("Token expired") |
| AUTH-20 | Token com assinatura inválida ou malformado. | `401 UNAUTHORIZED` ("Invalid token") |
| AUTH-21 | Token válido cujo usuário não existe mais no banco. | `401 UNAUTHORIZED` ("User no longer exists") |
| AUTH-22 | A autenticação recarrega o usuário do banco a cada requisição; `role` e dados refletem o estado atual, não o do momento da emissão do token. | — |

### 2.4 Papéis e autorização

| Código | Regra | Violação |
|---|---|---|
| AUTH-23 | Existem dois papéis: `CUSTOMER` e `ADMIN`. Padrão de novo usuário é `CUSTOMER`. | — |
| AUTH-24 | Endpoints exclusivos de ADMIN: usuário autenticado com papel diferente de `ADMIN`. | `403 FORBIDDEN` ("Insufficient permissions") |
| AUTH-25 | `GET /auth/me` retorna o usuário autenticado atual (sem `password`). Exige token válido. | `401 UNAUTHORIZED` se sem token |

### 2.5 Matriz de acesso por endpoint

| Endpoint | Acesso |
|---|---|
| `POST /auth/register`, `POST /auth/login` | Público |
| `GET /auth/me` | Autenticado (qualquer papel) |
| `GET /products`, `GET /products/:slug`, `GET /products/by-id/:id`, `GET /products/:slug/related` | Público |
| `GET /products/:productId/reviews` | Público |
| `GET /categories`, `GET /categories/:slug` | Público |
| `POST/PATCH/DELETE /products`, `POST/PATCH/DELETE /categories` | ADMIN |
| `GET /users` | ADMIN |
| `GET /users/:id`, `PATCH /users/:id` | ADMIN **ou** o próprio usuário |
| `DELETE /users/:id` | ADMIN |
| `GET /users/me/stats` | Autenticado (qualquer papel) |
| `GET /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/:productId`, `DELETE /cart` | Autenticado (qualquer papel) |
| `GET /coupons`, `POST /coupons`, `PATCH/DELETE /coupons/:id` | ADMIN |
| `POST /coupons/validate` | Autenticado (qualquer papel) |
| `GET /orders`, `GET /orders/:id`, `POST /orders` | Autenticado (cliente vê só os próprios) |
| `POST /orders/:id/pay`, `POST /orders/:id/cancel` | Autenticado — dono do pedido ou ADMIN |
| `POST /orders/:id/ship`, `POST /orders/:id/deliver` | ADMIN |
| `POST /products/:productId/reviews` | Autenticado |
| `PATCH /reviews/:id` | Autor da avaliação ou ADMIN (ver REV-09) |
| `DELETE /reviews/:id` | Autor da avaliação ou ADMIN |

---

<a name="usuarios"></a>
## 3. Usuários

| Código | Regra | Violação |
|---|---|---|
| USER-01 | `GET /users` lista usuários paginados, ordenados por `createdAt` desc. Apenas ADMIN. | `403 FORBIDDEN` para não-ADMIN; `401` sem token |
| USER-02 | `GET /users/:id` retorna o usuário. Acesso permitido apenas ao ADMIN ou ao próprio usuário (`req.userId === id`). | `403 FORBIDDEN` ("You can only access your own profile") |
| USER-03 | `GET /users/:id` com id inexistente. | `404 NOT_FOUND` ("User not found") |
| USER-04 | A checagem de propriedade (USER-02) ocorre **antes** da busca no banco; um cliente que pede o id de outro usuário recebe `403` mesmo que esse id não exista. | — |
| USER-05 | `PATCH /users/:id`: somente ADMIN ou o próprio usuário podem atualizar. | `403 FORBIDDEN` ("You can only update your own profile") |
| USER-06 | `PATCH /users/:id` aceita **apenas** os campos `name` e `email` (schema `strict`). Qualquer campo extra — inclusive `role` e `password` — é **rejeitado**. | `400 VALIDATION_ERROR` |
| USER-07 | **O papel (`role`) não pode ser alterado** por este endpoint (campo omitido propositalmente do schema; enviar `role` gera `400` por causa do `strict`). | `400 VALIDATION_ERROR` |
| USER-08 | `PATCH /users/:id`: `name` (se enviado) — string `trim`, 1 a 100 caracteres; `email` (se enviado) — formato válido, normalizado para minúsculas. | `400 VALIDATION_ERROR` |
| USER-09 | Ao alterar o e-mail para um valor já usado por outro usuário. | `409 CONFLICT` ("Email already in use") |
| USER-10 | `PATCH /users/:id` com id inexistente. | `404 NOT_FOUND` ("User not found") |
| USER-11 | `DELETE /users/:id`: apenas ADMIN. Sucesso retorna `204` sem corpo. | `403 FORBIDDEN` para não-ADMIN |
| USER-12 | `DELETE /users/:id` com id inexistente. | `404 NOT_FOUND` ("User not found") |
| USER-13 | Excluir um usuário remove em cascata o seu `Cart` e os `CartItem` (relação `onDelete: Cascade`). Pedidos, reviews e usos de cupom **não** têm cascade — excluir um usuário com pedidos pode falhar por violação de FK no banco. | — |
| USER-14 | `GET /users/me/stats` retorna estatísticas agregadas do usuário autenticado (ver USER-15 a USER-19). | `401` sem token |

### 3.1 `GET /users/me/stats` — cálculo

| Código | Regra |
|---|---|
| USER-15 | `ordersCount`: total de pedidos do usuário, **incluindo CANCELED** (todos os status). |
| USER-16 | `deliveredCount`: número de pedidos atualmente no status `DELIVERED`. |
| USER-17 | `totalSpent`: soma do campo `total` dos pedidos nos status `PAID`, `SHIPPED` e `DELIVERED`. **Exclui** `PENDING` e `CANCELED`. Arredondado a 2 casas decimais. |
| USER-18 | `isFirstPurchase`: `true` quando `ordersCount === 0` (o usuário nunca criou nenhum pedido). |
| USER-19 | Observação para QA: `isFirstPurchase` torna-se `false` assim que o usuário tem **qualquer** pedido, mesmo um pedido `PENDING` ou `CANCELED` (não exige pedido pago/entregue). |

---

<a name="categorias"></a>
## 4. Categorias

| Código | Regra | Violação |
|---|---|---|
| CAT-01 | `GET /categories` é público e lista todas as categorias ordenadas por `name` ascendente. Retorna um **array puro** (sem paginação). | — |
| CAT-02 | `GET /categories/:slug` é público e retorna a categoria pelo slug. | `404 NOT_FOUND` ("Category not found") se inexistente |
| CAT-03 | `POST /categories`: apenas ADMIN. Campos: `name` obrigatório; `slug`, `description`, `imageUrl` opcionais. | `403 FORBIDDEN` / `401` |
| CAT-04 | `name`: string `trim`, 1 a 80 caracteres. `slug` (se enviado): string `trim`, 1 a 80. `description`: até 500 caracteres, pode ser `null`. `imageUrl`: deve ser uma URL válida, até 500 caracteres, pode ser `null`. | `400 VALIDATION_ERROR` |
| CAT-05 | **Geração de slug**: se `slug` não for enviado, ele é derivado do `name`. Se enviado, o valor recebido também passa pelo `slugify`. O `slugify` normaliza unicode, remove acentos, converte para minúsculas, troca não-alfanuméricos por `-` e trunca em 80 caracteres. | — |
| CAT-06 | **Unicidade de nome**: o `name` deve ser único. | `409 CONFLICT` ("Category name already exists") |
| CAT-07 | **Unicidade de slug**: o slug final deve ser único. | `409 CONFLICT` ("Category slug already exists") |
| CAT-08 | `PATCH /categories/:id`: apenas ADMIN. Schema `strict` — aceita só `name`, `slug`, `description`, `imageUrl`; campo extra gera `400`. | `400 VALIDATION_ERROR` / `403` |
| CAT-09 | `PATCH /categories/:id` com id inexistente. | `404 NOT_FOUND` ("Category not found") |
| CAT-10 | Em `PATCH`, se `name` for alterado para um já existente em outra categoria. | `409 CONFLICT` ("Category name already exists") |
| CAT-11 | Em `PATCH`, se o `slug` (após `slugify`) for alterado para um já existente em outra categoria. | `409 CONFLICT` ("Category slug already exists") |
| CAT-12 | `DELETE /categories/:id`: apenas ADMIN. Sucesso retorna `204`. | `403` / `401` |
| CAT-13 | `DELETE /categories/:id` com id inexistente. | `404 NOT_FOUND` ("Category not found") |
| CAT-14 | **Não é possível excluir uma categoria que tenha produtos vinculados.** | `409 CONFLICT` ("Cannot delete category with associated products") |

> Nota QA (CAT-04): a documentação Swagger de `POST /categories` lista apenas `name`, `slug` e `description`, mas o schema Zod também aceita `imageUrl`.

---

<a name="produtos"></a>
## 5. Produtos

### 5.1 Criação (`POST /products`) — ADMIN

| Código | Regra | Violação |
|---|---|---|
| PROD-01 | Apenas ADMIN. Campos obrigatórios: `name`, `description`, `price`, `categoryId`. | `403` / `400 VALIDATION_ERROR` |
| PROD-02 | `name`: string `trim`, 1 a 150 caracteres. | `400 VALIDATION_ERROR` |
| PROD-03 | `slug`: opcional, string `trim`, 1 a 150. Se omitido, derivado do `name` via `slugify`; se enviado, também passa pelo `slugify`. | — |
| PROD-04 | `description`: string, 1 a 2000 caracteres (obrigatória). | `400 VALIDATION_ERROR` |
| PROD-05 | `price`: número **estritamente positivo** (`> 0`). Zero ou negativo é inválido. | `400 VALIDATION_ERROR` ("price must be greater than 0") |
| PROD-06 | `stock`: inteiro `>= 0`. Padrão `0` quando omitido. Não pode ser negativo. | `400 VALIDATION_ERROR` ("stock cannot be negative") |
| PROD-07 | `active`: booleano, padrão `true` quando omitido. | `400 VALIDATION_ERROR` |
| PROD-08 | `imageUrl`: opcional/`null`, deve ser URL válida, até 2000 caracteres. | `400 VALIDATION_ERROR` |
| PROD-09 | `categoryId`: string não vazia e obrigatória; a categoria precisa existir. | `404 NOT_FOUND` ("Category not found") se não existir |
| PROD-10 | **Unicidade de slug**: o slug final deve ser único entre produtos. | `409 CONFLICT` ("Product slug already exists") |
| PROD-11 | Sucesso retorna `201` com o produto criado incluindo o objeto `category`. | — |

### 5.2 Atualização (`PATCH /products/:id`) — ADMIN

| Código | Regra | Violação |
|---|---|---|
| PROD-12 | Apenas ADMIN. Schema `strict` — aceita só `name`, `slug`, `description`, `price`, `stock`, `active`, `imageUrl`, `categoryId`; campo extra gera `400`. | `400 VALIDATION_ERROR` / `403` |
| PROD-13 | Todas as validações de tipo/limites do PROD-02 a PROD-08 valem para os campos enviados (todos opcionais no `PATCH`). | `400 VALIDATION_ERROR` |
| PROD-14 | `PATCH` com id inexistente. | `404 NOT_FOUND` ("Product not found") |
| PROD-15 | Se o `slug` for alterado (após `slugify`) para um já usado por outro produto. | `409 CONFLICT` ("Product slug already exists") |
| PROD-16 | Se `categoryId` for alterado para uma categoria inexistente. | `404 NOT_FOUND` ("Category not found") |

### 5.3 Exclusão (`DELETE /products/:id`) — ADMIN

| Código | Regra | Violação |
|---|---|---|
| PROD-17 | `DELETE` com id inexistente. | `404 NOT_FOUND` ("Product not found") |
| PROD-18 | **Soft delete**: se o produto tiver **pelo menos um `OrderItem`** (já apareceu em algum pedido), ele NÃO é removido — apenas tem `active` definido como `false`. A resposta é `200` com o produto agora inativo. | — |
| PROD-19 | **Hard delete**: se o produto **não tiver nenhum `OrderItem`**, o registro é removido de fato. Antes de remover, todos os `CartItem` que referenciam o produto são apagados (`deleteMany`) para evitar violação de FK. A resposta é `204` sem corpo. | — |

### 5.4 Leitura de produtos

| Código | Regra | Violação |
|---|---|---|
| PROD-20 | `GET /products/:slug` (público) retorna o produto pelo slug, com `category`, `avgRating` e `reviewsCount`. O array bruto `reviews` não é exposto. | `404 NOT_FOUND` ("Product not found") |
| PROD-21 | `GET /products/by-id/:id` (público) é equivalente ao PROD-20, porém busca pelo id (CUID interno). | `404 NOT_FOUND` ("Product not found") |
| PROD-22 | `avgRating` e `reviewsCount` são calculados a partir das avaliações. Presentes em `GET /products` (listagem), `GET /products/:slug`, `GET /products/by-id/:id` e `GET /products/:slug/related`. `avgRating` é `null` sem avaliações. | — |
| PROD-23 | `GET /products/:slug/related` (público) retorna até `limit` produtos da **mesma categoria** do produto referenciado, filtrando: `active = true`, `stock > 0`, e **excluindo o próprio produto**. Ordenado por `createdAt` desc. Retorna um **array puro** (sem paginação). | `404 NOT_FOUND` se o slug não existir |
| PROD-24 | Parâmetro `limit` de `related`: inteiro de 1 a 12, padrão `4`. Valor fora da faixa gera `400`. | `400 VALIDATION_ERROR` |

### 5.5 Listagem, filtros e busca (`GET /products`) — público

| Código | Regra | Violação |
|---|---|---|
| PROD-25 | Endpoint público, paginado. Sem filtros, retorna **todos** os produtos — inclusive inativos e sem estoque (não há filtro `active` automático). | — |
| PROD-26 | Filtro `category`: slug da categoria; retorna apenas produtos daquela categoria. | — |
| PROD-27 | Filtro `search`: busca textual em `name` **OU** `description` (operador `contains`). **Atenção QA**: em SQLite o `contains` é case-sensitive por padrão — a busca diferencia maiúsculas/minúsculas. | — |
| PROD-28 | Filtros `minPrice` e `maxPrice`: número `>= 0`. Aplicam `price >= minPrice` e/ou `price <= maxPrice`. | `400 VALIDATION_ERROR` se negativo |
| PROD-29 | Filtro `active`: aceita `true`/`false` (string ou booleano). Quando enviado, filtra produtos por status ativo. Quando omitido, não filtra. | `400 VALIDATION_ERROR` se valor inválido |
| PROD-30 | Parâmetro `sort`: um de `price`, `-price`, `name`, `-name`, `createdAt`, `-createdAt`. Prefixo `-` indica ordem descendente. Padrão (omitido): `createdAt` desc. | `400 VALIDATION_ERROR` se valor fora do enum |
| PROD-31 | Paginação: `page` (padrão 1) e `pageSize` (padrão 10, máx. 100). Resposta no formato `{ data, meta }`. Ver seção [Paginação](#paginacao). | — |
| PROD-32 | Os filtros são combináveis (todos via `AND`); `search` internamente é um `OR` entre `name` e `description`. | — |
| PROD-33 | Filtro `inStock`: `true` retorna apenas produtos com `stock > 0`; `false` retorna produtos com `stock <= 0`. Omitido = sem filtro de estoque. **Não filtra `active`** — combine com `active=true` para ocultar inativos. | `400 VALIDATION_ERROR` se valor inválido |

---

<a name="carrinho"></a>
## 6. Carrinho

Todos os endpoints de `/cart` exigem autenticação. Cada usuário tem exatamente um carrinho (relação 1-1).

| Código | Regra | Violação |
|---|---|---|
| CART-01 | `GET /cart` retorna o carrinho do usuário autenticado com `items`, `subtotal` e `itemCount`. Se o usuário ainda não tiver carrinho, um é criado automaticamente (lazy). | `401` sem token |
| CART-02 | `subtotal`: soma de `unitPrice * quantity` de cada item, arredondada a 2 casas. `itemCount`: soma das quantidades de todos os itens. `lineTotal` por item: `unitPrice * quantity`. | — |
| CART-03 | O `unitPrice` exibido no carrinho é o **preço atual do produto** (lido em tempo real), não um snapshot. | — |
| CART-04 | `POST /cart/items` — body obrigatório: `productId` (string não vazia) e `quantity` (inteiro, mínimo **1**). | `400 VALIDATION_ERROR` |
| CART-05 | `POST /cart/items` com `productId` inexistente. | `404 NOT_FOUND` ("Product not found") |
| CART-06 | Produto **inativo** (`active = false`) não pode ser adicionado ao carrinho. | `422` com `code: PRODUCT_INACTIVE` ("Product is inactive") |
| CART-07 | **Validação de estoque ao adicionar**: a quantidade desejada (quantidade já existente no carrinho **+** quantidade nova) não pode exceder `product.stock`. | `422` com `code: INSUFFICIENT_STOCK`, `details: { available, requested }` |
| CART-08 | **Item já existente**: adicionar um produto que já está no carrinho **incrementa** a quantidade (`existente + nova`), não substitui. A validação de estoque (CART-07) considera essa soma. | — |
| CART-09 | `POST /cart/items` com sucesso retorna `201` com o carrinho completo atualizado. | — |
| CART-10 | `PATCH /cart/items/:productId` — body obrigatório: `quantity` (inteiro, mínimo **0**). | `400 VALIDATION_ERROR` |
| CART-11 | `PATCH /cart/items/:productId` quando o item não está no carrinho. | `404 NOT_FOUND` ("Cart item not found") |
| CART-12 | **`quantity = 0` no PATCH remove o item** do carrinho. Nesse caso, nenhuma validação de produto/estoque é feita. | — |
| CART-13 | `PATCH` com `quantity > 0`: o produto precisa existir e estar ativo; caso inativo. | `422` com `code: PRODUCT_INACTIVE` |
| CART-14 | `PATCH` com `quantity > 0`: a quantidade **define** o novo valor (substitui, não incrementa) e não pode exceder o estoque. | `422` com `code: INSUFFICIENT_STOCK`, `details: { available, requested }` |
| CART-15 | `PATCH` com `quantity > 0` e produto inexistente (raro — produto removido). | `404 NOT_FOUND` ("Product not found") |
| CART-16 | `DELETE /cart/items/:productId` remove um item específico. Item não presente no carrinho. | `404 NOT_FOUND` ("Cart item not found") |
| CART-17 | `DELETE /cart` esvazia o carrinho (remove todos os itens) e retorna o carrinho vazio. Não há erro se já estiver vazio. | — |
| CART-18 | Não é possível ter o mesmo produto duas vezes no carrinho (constraint única `[cartId, productId]`); por isso a adição incrementa (CART-08). | — |
| CART-19 | `GET /cart` **consolida linhas duplicadas** do mesmo `productId` (dados legados) antes de retornar o carrinho. | — |
| CART-20 | A consolidação mantém a **primeira linha** (ordem por `id`) e **soma** as quantidades das demais; remove as duplicatas. | — |
| CART-21 | Se a quantidade consolidada exceder `product.stock`, a consolidação falha. | `422` com `code: INSUFFICIENT_STOCK`, `details: { available, requested }` |
| CART-22 | `POST /orders` chama `consolidateCartForUser` **antes** de montar o pedido — garante carrinho sem duplicatas no checkout. | — |

---

<a name="cupons"></a>
## 7. Cupons

### 7.1 Gestão (ADMIN)

| Código | Regra | Violação |
|---|---|---|
| COUP-01 | `GET /coupons` (ADMIN) lista todos os cupons, ordenados por `createdAt` desc, incluindo a contagem de usos. | `403` / `401` |
| COUP-02 | `POST /coupons` (ADMIN) — campos obrigatórios: `code`, `type`, `value`, `validFrom`, `validUntil`. | `400 VALIDATION_ERROR` |
| COUP-03 | `code`: string `trim`, 1 a 40 caracteres; **convertido para maiúsculas** automaticamente. | `400 VALIDATION_ERROR` |
| COUP-04 | `type`: deve ser exatamente `PERCENTAGE` ou `FIXED`. | `400 VALIDATION_ERROR` |
| COUP-05 | `value`: número **estritamente positivo**. | `400 VALIDATION_ERROR` |
| COUP-06 | Para `type = PERCENTAGE`, `value` **não pode exceder 100**. | `400 VALIDATION_ERROR` ("PERCENTAGE coupon value cannot exceed 100") |
| COUP-07 | `minOrderValue`: número `>= 0`, padrão `0`. `maxDiscount`: número positivo opcional/`null`. `usageLimit`: inteiro positivo opcional/`null`. `perUserLimit`: inteiro positivo, padrão `1`. | `400 VALIDATION_ERROR` |
| COUP-08 | `validFrom` e `validUntil`: strings de data ISO válidas. `validUntil` **deve ser posterior** a `validFrom`. | `400 VALIDATION_ERROR` ("validUntil must be after validFrom") |
| COUP-09 | `active`: booleano, padrão `true`. | `400 VALIDATION_ERROR` |
| COUP-10 | **Unicidade de `code`** (após conversão para maiúsculas). | `409 CONFLICT` ("Coupon code already exists") |
| COUP-11 | `PATCH /coupons/:id` (ADMIN) — schema `strict`; campo extra gera `400`. Id inexistente. | `404 NOT_FOUND` ("Coupon not found") |
| COUP-12 | Em `PATCH`, alterar `code` para um já existente. | `409 CONFLICT` ("Coupon code already exists") |
| COUP-13 | Em `PATCH`, a regra `validUntil > validFrom` é revalidada combinando os valores enviados com os já existentes. Se violada. | `409 CONFLICT` ("validUntil must be after validFrom") — observe: aqui o status é **409**, não 400 |
| COUP-14 | `DELETE /coupons/:id` (ADMIN): **soft delete** (`active = false`, resposta `200`) se o cupom já tiver pelo menos um uso; **hard delete** (registro removido, resposta `204`) se não tiver nenhum uso. Id inexistente. | `404 NOT_FOUND` ("Coupon not found") |

### 7.2 Tipos e cálculo de desconto

| Código | Regra |
|---|---|
| COUP-15 | **Cupom `PERCENTAGE`**: desconto = `orderValue * value / 100`. |
| COUP-16 | **`maxDiscount`** (só para PERCENTAGE): se definido e o desconto calculado o ultrapassar, o desconto é limitado a `maxDiscount`. |
| COUP-17 | **Cupom `FIXED`**: desconto = `value` (valor absoluto). Se `value` for maior que `orderValue`, o desconto é limitado ao próprio `orderValue` — **o total nunca fica negativo**. |
| COUP-18 | O desconto e o `finalValue` (`orderValue - discount`) são arredondados a 2 casas decimais. |

### 7.3 Validação de cupom (`POST /coupons/validate`)

`POST /coupons/validate` (autenticado) **apenas simula** a aplicação do cupom — **NÃO consome uso** e não cria `CouponUsage`. Body: `code` (string, convertida para maiúsculas) e `orderValue` (número `>= 0`).

A resposta é sempre `200` (mesmo quando o cupom é inválido), com o corpo `{ valid, discount, finalValue, reason? }`. As condições abaixo são verificadas **nesta ordem**; a primeira que falhar define o `reasonCode`:

| Código | Condição verificada | `reasonCode` retornado |
|---|---|---|
| COUP-19 | Cupom (pelo `code`) não existe. | `COUPON_NOT_FOUND` |
| COUP-20 | Cupom existe mas está inativo (`active = false`). | `INVALID_COUPON` |
| COUP-21 | Data atual fora do período `validFrom`..`validUntil`. | `COUPON_EXPIRED` |
| COUP-22 | Limite total de usos atingido (`usageLimit` definido e nº de usos `>=` limite). | `COUPON_USAGE_EXCEEDED` |
| COUP-23 | Limite por usuário atingido (usos do usuário `>= perUserLimit`). | `COUPON_USAGE_EXCEEDED` |
| COUP-24 | `orderValue` menor que `minOrderValue` do cupom. | `INVALID_COUPON` |
| COUP-25 | Se todas as condições passam: `valid: true`, `discount` e `finalValue` calculados conforme COUP-15 a COUP-18. | — |

> Nota QA: `POST /coupons/validate` não retorna o campo interno `reasonCode` no corpo (ele é removido pelo controller). O cliente vê apenas `reason` (texto). O `reasonCode` listado acima é o que a API usa internamente e é o `code` propagado quando o cupom é aplicado num pedido (ver ORD-09).

---

<a name="pedidos"></a>
## 8. Pedidos

Todos os endpoints de `/orders` exigem autenticação.

### 8.1 Criação do pedido a partir do carrinho (`POST /orders`)

| Código | Regra | Violação |
|---|---|---|
| ORD-01 | Body: `shippingAddress` obrigatório (string `trim`, 1 a 500 caracteres); `couponCode` opcional/`null` (string, convertida para maiúsculas). | `400 VALIDATION_ERROR` |
| ORD-02 | O pedido é montado a partir do **carrinho atual** do usuário (após consolidação — CART-22). Carrinho inexistente ou vazio. | `422` com `code: EMPTY_CART` ("Cart is empty") |
| ORD-03 | **Pré-checagem (fora da transação)**: se qualquer item do carrinho referenciar um produto inativo, a criação falha imediatamente. | `422` com `code: PRODUCT_INACTIVE`, `details: { productId }` |
| ORD-04 | O `subtotal` é a soma de `preço atual * quantidade` de todos os itens do carrinho, arredondado a 2 casas. | — |
| ORD-05 | Se `couponCode` for informado, o cupom é avaliado (mesmas regras COUP-19 a COUP-24). Cupom inválido **impede a criação do pedido**. | `422` com o `code` correspondente à razão (ex.: `COUPON_EXPIRED`, `INVALID_COUPON`, `COUPON_USAGE_EXCEEDED`, `COUPON_NOT_FOUND`) |
| ORD-06 | `total = subtotal - discount`, arredondado a 2 casas. |  — |
| ORD-07 | **Atomicidade**: a baixa de estoque, a criação do pedido/itens, o registro de uso do cupom e o esvaziamento do carrinho ocorrem dentro de uma `prisma.$transaction`. Qualquer falha reverte tudo (estoque não é debitado, pedido não é criado). | — |
| ORD-08 | Dentro da transação, o estoque de cada produto é **revalidado** com o valor atual do banco. Se `stock < quantidade pedida`. | `422` com `code: INSUFFICIENT_STOCK`, `details: { productId, available, requested }` |
| ORD-09 | Dentro da transação, o estoque de cada item é decrementado (`decrement`). Também há nova checagem de produto inativo (`PRODUCT_INACTIVE`) e, se houver cupom, recheca os limites de uso (`COUPON_USAGE_EXCEEDED`) para evitar condição de corrida. | `422` |
| ORD-10 | **Snapshot**: cada `OrderItem` grava `productName` e `unitPrice` com os valores do produto **no momento da criação**. Alterações futuras de preço/nome do produto não afetam pedidos já criados. | — |
| ORD-11 | Se houver cupom válido, um `CouponUsage` é criado vinculando cupom + usuário + pedido; `couponCode` é gravado no pedido. | — |
| ORD-12 | Após a criação, o carrinho do usuário é esvaziado (todos os `CartItem` removidos). | — |
| ORD-13 | O pedido nasce com `status = PENDING`. Sucesso retorna `201` com o pedido (incluindo `items` e dados básicos do `user`). | — |

### 8.2 Máquina de estados do pedido

Status possíveis: `PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELED`.

Transições implementadas:

| Código | Transição | Endpoint | Estado(s) de origem permitido(s) | Quem pode | Campo de data atualizado |
|---|---|---|---|---|---|
| ORD-14 | → `PAID` | `POST /orders/:id/pay` | `PENDING` | Dono do pedido **ou** ADMIN | `paidAt` |
| ORD-15 | → `SHIPPED` | `POST /orders/:id/ship` | `PAID` | **Somente ADMIN** | `shippedAt` |
| ORD-16 | → `DELIVERED` | `POST /orders/:id/deliver` | `SHIPPED` | **Somente ADMIN** | `deliveredAt` |
| ORD-17 | → `CANCELED` | `POST /orders/:id/cancel` | `PENDING` ou `PAID` | Dono do pedido **ou** ADMIN | `canceledAt` |

Regras de violação da máquina de estados:

| Código | Regra | Violação |
|---|---|---|
| ORD-18 | Transição a partir de um estado não permitido (ex.: pagar um pedido já `PAID`, enviar um `PENDING`, entregar um `PAID`, cancelar um `SHIPPED`/`DELIVERED`/`CANCELED`). | `422` com `code: INVALID_ORDER_STATUS`, mensagem indicando estado atual e alvo |
| ORD-19 | Qualquer transição com `id` de pedido inexistente. | `404 NOT_FOUND` ("Order not found") |
| ORD-20 | `pay`: um usuário que não é dono nem ADMIN. | `403 FORBIDDEN` ("You can only act on your own orders") |
| ORD-21 | `ship`/`deliver`: usuário não-ADMIN (inclusive o dono do pedido). | `403 FORBIDDEN` ("Insufficient permissions") — barrado pelo middleware `requireAdmin` |
| ORD-22 | `cancel`: usuário que não é dono nem ADMIN. | `403 FORBIDDEN` ("You can only cancel your own orders") |
| ORD-23 | Não existe transição de volta (ex.: de `SHIPPED` para `PAID`) nem caminho que pule estados. Não há como cancelar a partir de `SHIPPED` ou `DELIVERED`. | `422 INVALID_ORDER_STATUS` |

### 8.3 Cancelamento

| Código | Regra | Violação |
|---|---|---|
| ORD-24 | Cancelamento é permitido **apenas** a partir de `PENDING` ou `PAID`. | `422` com `code: INVALID_ORDER_STATUS` |
| ORD-25 | Ao cancelar, dentro de uma transação: o estoque de **cada item** do pedido é **devolvido** (`increment`). | — |
| ORD-26 | Ao cancelar, se o pedido teve um cupom aplicado, o `CouponUsage` é **removido** — o uso do cupom é liberado (volta a contar para os limites). | — |
| ORD-27 | O pedido passa a `CANCELED` e `canceledAt` recebe a data atual. | — |

### 8.4 Consulta de pedidos

| Código | Regra | Violação |
|---|---|---|
| ORD-28 | `GET /orders` (autenticado): **cliente vê apenas os próprios pedidos**; **ADMIN vê todos**. Ordenado por `createdAt` desc, paginado. | — |
| ORD-29 | Filtro `userId`: aplicado **somente para ADMIN**. Se um cliente enviar `userId`, ele é ignorado (o cliente continua restrito aos próprios pedidos). | — |
| ORD-30 | Filtro `status`: um de `PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELED`. | `400 VALIDATION_ERROR` se fora do enum |
| ORD-31 | Filtro `productId`: retorna apenas pedidos que contenham **ao menos um item** com aquele produto. O array `items` de cada pedido retornado continua **completo** (não é filtrado a só os itens correspondentes). | — |
| ORD-32 | `GET /orders/:id`: retorna o pedido. Cliente só pode acessar os próprios; ADMIN acessa qualquer um. | `403 FORBIDDEN` ("You can only access your own orders") se não for dono/ADMIN |
| ORD-33 | `GET /orders/:id` com id inexistente. | `404 NOT_FOUND` ("Order not found") |
| ORD-34 | Paginação padrão: `page=1`, `pageSize=10`, máx. `100`. Resposta `{ data, meta }`. | — |

---

<a name="avaliacoes"></a>
## 9. Avaliações (Reviews)

| Código | Regra | Violação |
|---|---|---|
| REV-01 | `GET /products/:productId/reviews` é **público** e paginado, ordenado por `createdAt` desc; inclui `id` e `name` do autor. | — |
| REV-02 | `GET /products/:productId/reviews` com `productId` inexistente. | `404 NOT_FOUND` ("Product not found") |
| REV-03 | `POST /products/:productId/reviews` exige autenticação. Body: `rating` (inteiro de **1 a 5**, obrigatório), `comment` (string até 1000 caracteres, opcional/`null`), `orderId` (string obrigatória). | `400 VALIDATION_ERROR` |
| REV-04 | O `productId` da URL precisa existir. | `404 NOT_FOUND` ("Product not found") |
| REV-05 | O `orderId` informado precisa existir. | `404 NOT_FOUND` ("Order not found") |
| REV-06 | O pedido (`orderId`) precisa **pertencer ao usuário autenticado**. | `403 FORBIDDEN` ("Order does not belong to this user") |
| REV-07 | **Elegibilidade**: o pedido precisa estar no status `DELIVERED`. | `422` com `code: ORDER_NOT_DELIVERED` ("Order has not been delivered yet") |
| REV-08 | O pedido precisa **conter o produto** que está sendo avaliado. | `422` com `code: ORDER_NOT_DELIVERED` ("Order does not contain this product") |
| REV-09 | **Limite de uma avaliação por par `(userId, productId)`** (constraint única). Tentar avaliar o mesmo produto duas vezes. | `409 CONFLICT` com `code: ALREADY_REVIEWED` ("You have already reviewed this product") |
| REV-10 | Sucesso retorna `201` com a avaliação criada. | — |
| REV-11 | `PATCH /reviews/:id`: schema `strict`, aceita só `rating` (1 a 5) e `comment` (até 1000 caracteres). Campo extra gera `400`. | `400 VALIDATION_ERROR` |
| REV-12 | `PATCH /reviews/:id` com id inexistente. | `404 NOT_FOUND` ("Review not found") |
| REV-13 | `PATCH /reviews/:id`: pode editar quem for o **autor da avaliação OU um ADMIN**. (Ver Observações OBS-02 — diverge do Swagger.) | `403 FORBIDDEN` ("You can only update your own reviews") |
| REV-14 | `DELETE /reviews/:id`: pode excluir o **autor da avaliação OU um ADMIN**. Sucesso retorna `204`. | `403 FORBIDDEN` ("You can only delete your own reviews") |
| REV-15 | `DELETE /reviews/:id` com id inexistente. | `404 NOT_FOUND` ("Review not found") |

---

<a name="paginacao"></a>
## 10. Paginação

| Código | Regra |
|---|---|
| PAG-01 | Parâmetros de query: `page` e `pageSize`. |
| PAG-02 | `page`: padrão `1`. Valores não numéricos ou `< 1` caem para o padrão `1`. |
| PAG-03 | `pageSize`: padrão `10`. Valores não numéricos ou `< 1` caem para o padrão `10`. |
| PAG-04 | `pageSize` máximo: `100`. Valores acima de 100 são limitados (clamp) a `100` — não geram erro. |
| PAG-05 | A normalização do `lib/pagination.js` faz clamp silencioso. Já os schemas Zod de algumas listagens (`users`, `products`, `orders`, `reviews`) declaram `page >= 1` e `pageSize` entre 1 e 100: nesses casos, **valores fora da faixa rejeitados pelo Zod retornam `400 VALIDATION_ERROR` antes de chegar ao clamp**. Importante para QA: `pageSize=0` ou `pageSize=101` tendem a gerar `400` nessas rotas, e não o clamp. |
| PAG-06 | Resposta paginada padrão: `{ data: [...], meta: { page, pageSize, total, totalPages } }`. |
| PAG-07 | `totalPages = ceil(total / pageSize)`; vale `0` quando `total` é `0`. |
| PAG-08 | Endpoints paginados: `GET /users`, `GET /products`, `GET /orders`, `GET /products/:productId/reviews`. |
| PAG-09 | **Não são paginados** (retornam array puro): `GET /categories`, `GET /coupons`, `GET /products/:slug/related`. |

---

<a name="codigos-de-erro"></a>
## 11. Códigos de erro

| Código de erro | Status HTTP | Onde ocorre |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Falha de schema Zod, JSON malformado, `BadRequestError`. |
| `UNAUTHORIZED` | 401 | Token ausente/malformado/inválido/expirado; credenciais inválidas no login; usuário do token não existe mais. |
| `FORBIDDEN` | 403 | Autenticado mas sem permissão (rota de admin acessada por cliente, acesso a recurso de outro usuário). |
| `NOT_FOUND` | 404 | Recurso inexistente (usuário, produto, categoria, pedido, item de carrinho, avaliação, cupom) e rota não mapeada. |
| `CONFLICT` | 409 | E-mail/nome/slug/código de cupom duplicado; categoria com produtos vinculados; `validUntil <= validFrom` no `PATCH` de cupom. |
| `ALREADY_REVIEWED` | 409 | Segunda avaliação do mesmo `(userId, productId)`. |
| `INSUFFICIENT_STOCK` | 422 | Quantidade pedida acima do estoque (carrinho ou criação de pedido). `details: { available, requested }`. |
| `PRODUCT_INACTIVE` | 422 | Produto inativo adicionado ao carrinho ou presente em pedido sendo criado. |
| `EMPTY_CART` | 422 | Criação de pedido com carrinho vazio/inexistente. |
| `INVALID_COUPON` | 422 (pedido) / corpo de `validate` | Cupom inativo ou `orderValue < minOrderValue`. |
| `COUPON_NOT_FOUND` | corpo de `validate` / 422 (pedido) | `code` de cupom inexistente. |
| `COUPON_EXPIRED` | corpo de `validate` / 422 (pedido) | Data atual fora do período de validade. |
| `COUPON_USAGE_EXCEEDED` | corpo de `validate` / 422 (pedido) | Limite total ou por usuário atingido. |
| `INVALID_ORDER_STATUS` | 422 | Transição de status não permitida; cancelamento de estado inválido. |
| `ORDER_NOT_DELIVERED` | 422 | Avaliação sem pedido `DELIVERED` ou pedido que não contém o produto. |
| `INTERNAL_ERROR` | 500 | Erro não tratado. |

Notas para QA:
- `COUPON_NOT_FOUND`, `COUPON_EXPIRED`, `COUPON_USAGE_EXCEEDED` e `INVALID_COUPON` aparecem como `reasonCode` interno no fluxo de validação. Em `POST /coupons/validate` o corpo retorna `200` com `valid:false` e um `reason` textual (o `reasonCode` é removido da resposta). Quando o cupom é aplicado em `POST /orders`, o mesmo código vira o `code` de um erro `422`.

---

<a name="estado-inicial"></a>
## 12. Estado inicial do banco (seed)

Útil para o QA montar cenários. O script `prisma/seed.js` **apaga todos os dados** (`deleteMany` em ordem de dependência) e repopula o banco.

> **`npm run db:seed`** e o seed automático de **`npm run db:reset`** executam o **mesmo** `prisma/seed.js`. Use `db:reset` quando também precisar reaplicar migrations do zero.

**Imagens de produto:** o seed usa URLs do **Unsplash** (`images.unsplash.com`) em `imageUrl`. Exemplos: `camiseta-basica-branca`, `introducao-a-algoritmos`. Sem `imageUrl`, o front cai em placeholder `picsum.photos` por slug.

**Usuários:**

| Papel | E-mail | Senha |
|---|---|---|
| ADMIN | `admin@test.com` | `Admin@123` |
| CUSTOMER | `alice@test.com` | `Alice@123` |
| CUSTOMER | `bob@test.com` | `Bob@123` |

**Categorias:** `Eletrônicos`, `Livros`, `Vestuário`, `Casa & Cozinha`.

**Produtos:** 25 produtos (24 ativos, 1 inativo, 1 sem estoque). Destaques para testes negativos:
- `O Programador Pragmático` (slug `o-programador-pragmatico`): `stock = 0`, `active = true` — útil para `INSUFFICIENT_STOCK`.
- `Moletom Vintage (descontinuado)` (slug `moletom-vintage-descontinuado`): `active = false` — útil para `PRODUCT_INACTIVE`.

**Cupons:**

| Código | Tipo | Valor | Observação |
|---|---|---|---|
| `WELCOME10` | PERCENTAGE | 10 | Válido; `minOrderValue=0`, `perUserLimit=1`, `usageLimit` nulo. |
| `BLACKFRIDAY` | FIXED | 50 | `minOrderValue=200`, `usageLimit=100`, `perUserLimit=1`. |
| `EXPIRED` | PERCENTAGE | 5 | `validUntil` no passado — retorna `COUPON_EXPIRED`. |

> Observação QA: nenhum dos cupons do seed define `maxDiscount`. Para testar a regra COUP-16, é preciso criar um cupom PERCENTAGE com `maxDiscount` via `POST /coupons`.

---

<a name="observacoes"></a>
## 13. Observações

Itens em que o **README/Swagger divergem do código** ou em que regras esperadas **não estão implementadas**.

- **OBS-01 — `PATCH /users/:id` com `role`:** o `cenarios.md` sugere o teste "enviar `role: ADMIN` em `PATCH /users/:id` (deve ser ignorado ou rejeitado)". O comportamento real é **rejeitado**: o schema é `strict`, então `role` (ou qualquer campo extra) gera `400 VALIDATION_ERROR`. Não é silenciosamente ignorado.

- **OBS-02 — Edição de avaliação por ADMIN:** o Swagger de `PATCH /reviews/:id` diz "author only — admins cannot edit content". O **código permite que um ADMIN edite** qualquer avaliação (`review.userId !== requester.id && requester.role !== 'ADMIN'`). Portanto, ADMIN **pode** editar conteúdo de avaliações — o Swagger está incorreto.

- **OBS-03 — Validação cruzada de cupom retorna 409, não 400:** no `PATCH /coupons/:id`, quando `validUntil <= validFrom` (combinando valores enviados e existentes), o erro lançado é um `ConflictError` → `409 CONFLICT`. Já no `POST /coupons` a mesma regra é validada pelo Zod e retorna `400 VALIDATION_ERROR`. O QA deve esperar status diferentes para a mesma regra conforme o endpoint.

- **OBS-04 — Busca textual case-sensitive:** `GET /products?search=` usa `contains` do SQLite, que é **case-sensitive** por padrão. Buscar `fone` e `Fone` produz resultados diferentes. O README descreve "busca textual livre" sem mencionar essa limitação.

- **OBS-05 — `GET /products` não filtra produtos inativos por padrão:** sem o parâmetro `active`, a listagem retorna produtos ativos **e** inativos. Não há ocultação automática de produtos inativos do catálogo público.

- **OBS-06 — Cancelamento de pedido limitado a PENDING/PAID:** não é possível cancelar pedidos `SHIPPED` ou `DELIVERED`. Não há fluxo de devolução/estorno após o envio.

- **OBS-07 — Exclusão de usuário com pedidos:** `DELETE /users/:id` faz cascade apenas em `Cart`/`CartItem`. Como `Order`, `Review` e `CouponUsage` referenciam `User` sem `onDelete: Cascade`, excluir um usuário que possui pedidos/avaliações tende a falhar com erro de FK do banco, resultando em `500 INTERNAL_ERROR` (não há tratamento específico).

- **OBS-08 — Sem filtro de `role` ou `search` em `GET /users`:** o endpoint de listagem de usuários aceita somente `page` e `pageSize`. Não há filtro por papel, e-mail ou nome.

- **OBS-09 — `imageUrl` em categorias:** o schema Zod de `POST/PATCH /categories` aceita o campo `imageUrl` (URL válida), embora a documentação inline do Swagger para `POST /categories` não o liste no request body.

- **OBS-10 — Validação de cupom não verifica estoque/itens:** `POST /coupons/validate` recebe apenas um `orderValue` numérico arbitrário do cliente; não valida contra o carrinho real. É uma simulação pura — o valor final só é garantido no `POST /orders`.

---

**Autor:** [Henrique Patti](https://www.linkedin.com/in/henrique-patti/)
