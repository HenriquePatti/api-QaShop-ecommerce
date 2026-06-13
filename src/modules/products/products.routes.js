import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as controller from './products.controller.js';
import {
  createProductSchema,
  idParamSchema,
  listQuerySchema,
  relatedQuerySchema,
  slugParamSchema,
  updateProductSchema,
} from './products.schema.js';

const router = Router();

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: List products (public, paginated, filterable, sortable)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *       - in: query
 *         name: category
 *         schema: { type: string, description: "Category slug" }
 *       - in: query
 *         name: search
 *         schema: { type: string, description: "Free-text search on name and description" }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number, minimum: 0 }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number, minimum: 0 }
 *       - in: query
 *         name: active
 *         schema: { type: boolean }
 *       - in: query
 *         name: inStock
 *         schema: { type: boolean, description: "true = stock > 0; false = stock <= 0" }
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price, -price, name, -name, createdAt, -createdAt]
 *     responses:
 *       200:
 *         description: Paginated list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Product' }
 *                 meta: { $ref: '#/components/schemas/Pagination' }
 */
router.get('/', validate({ query: listQuerySchema }), asyncHandler(controller.list));

/**
 * @swagger
 * /products/by-id/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a product by id (includes category, avgRating, reviewsCount)
 *     description: |
 *       Convenience endpoint mirroring `GET /products/{slug}` but keyed by the
 *       internal CUID. Useful when the client already holds the product id
 *       (cart/order item) and wants to avoid a slug round-trip.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "clxxxxxxxx0000abcd1234efgh" }
 *     responses:
 *       200:
 *         description: Product
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get(
  '/by-id/:id',
  validate({ params: idParamSchema }),
  asyncHandler(controller.getById)
);

/**
 * @swagger
 * /products/{slug}/related:
 *   get:
 *     tags: [Products]
 *     summary: List related products (same category, active, in-stock)
 *     description: |
 *       Returns up to `limit` products in the same category as `{slug}`.
 *       Inactive or out-of-stock products and the referenced product itself
 *       are excluded. Ordered by `createdAt` descending. Returns a plain
 *       array (no pagination wrapper) since this powers a fixed-size strip.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 12, default: 4 }
 *         description: Maximum number of products returned.
 *     responses:
 *       200:
 *         description: Related products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Product' }
 *             examples:
 *               default:
 *                 value:
 *                   - id: "clxxxxxxxx0000abcd1234efgh"
 *                     name: "Mechanical Keyboard"
 *                     slug: "mechanical-keyboard"
 *                     price: 349.9
 *                     stock: 12
 *                     active: true
 *                     categoryId: "clxxxxxxxx0000abcd1234zzzz"
 *                     category: { id: "clxxxxxxxx0000abcd1234zzzz", name: "Peripherals", slug: "peripherals" }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get(
  '/:slug/related',
  validate({ params: slugParamSchema, query: relatedQuerySchema }),
  asyncHandler(controller.getRelated)
);

/**
 * @swagger
 * /products/{slug}:
 *   get:
 *     tags: [Products]
 *     summary: Get a product by slug (includes category, avgRating, reviewsCount)
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:slug', validate({ params: slugParamSchema }), asyncHandler(controller.getBySlug));

/**
 * @swagger
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Create a product (admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, price, categoryId]
 *             properties:
 *               name:        { type: string, example: "Mechanical Keyboard" }
 *               slug:        { type: string, example: "mechanical-keyboard" }
 *               description: { type: string, example: "Hot-swappable, RGB, brown switches" }
 *               price:       { type: number, example: 349.9 }
 *               stock:       { type: integer, example: 50 }
 *               active:      { type: boolean, example: true }
 *               categoryId:  { type: string, example: "clxxxxxxxx0000abcd1234efgh" }
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate({ body: createProductSchema }),
  asyncHandler(controller.create)
);

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update a product (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:        { type: string }
 *               slug:        { type: string }
 *               description: { type: string }
 *               price:       { type: number }
 *               stock:       { type: integer }
 *               active:      { type: boolean }
 *               categoryId:  { type: string }
 *     responses:
 *       200:
 *         description: Updated product
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema, body: updateProductSchema }),
  asyncHandler(controller.update)
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product (admin)
 *     description: |
 *       - **Soft delete** (active=false) when the product has at least one order item.
 *       - **Hard delete** (record removed) when there are no order items.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Soft-deleted product (still exists, active=false)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       204: { description: Hard-deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema }),
  asyncHandler(controller.remove)
);

export default router;
