import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as controller from './orders.controller.js';
import {
  createOrderSchema,
  idParamSchema,
  listQuerySchema,
} from './orders.schema.js';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List orders (own for customers, all for admins)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *       - in: query
 *         name: userId
 *         schema: { type: string, description: "Admin only — filter by user" }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, PAID, SHIPPED, DELIVERED, CANCELED] }
 *       - in: query
 *         name: productId
 *         schema: { type: string, example: "clxxxxxxxx0000abcd1234efgh" }
 *         description: |
 *           Return only orders containing at least one item with this product.
 *           The full `items[]` array of each matching order is preserved
 *           (the filter affects which orders are returned, not which items).
 *     responses:
 *       200:
 *         description: Paginated list of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Order' }
 *                 meta: { $ref: '#/components/schemas/Pagination' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', validate({ query: listQuerySchema }), asyncHandler(controller.list));

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get an order by id (owner or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Order' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', validate({ params: idParamSchema }), asyncHandler(controller.getById));

/**
 * @swagger
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create an order from the current cart
 *     description: |
 *       Atomic operation. Validates inventory, decrements stock, snapshots
 *       product name & price into each OrderItem, applies coupon, and clears
 *       the cart. Initial status is `PENDING`.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shippingAddress]
 *             properties:
 *               shippingAddress: { type: string, example: "Rua Exemplo, 123 - Sao Paulo/SP" }
 *               couponCode:      { type: string, nullable: true, example: "WELCOME10" }
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Order' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       422:
 *         description: Empty cart, inactive product, insufficient stock, or invalid coupon
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/', validate({ body: createOrderSchema }), asyncHandler(controller.create));

/**
 * @swagger
 * /orders/{id}/pay:
 *   post:
 *     tags: [Orders]
 *     summary: Pay an order (mock — owner only). PENDING -> PAID.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated order
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Order' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       422: { $ref: '#/components/responses/Unprocessable' }
 */
router.post('/:id/pay', validate({ params: idParamSchema }), asyncHandler(controller.pay));

/**
 * @swagger
 * /orders/{id}/ship:
 *   post:
 *     tags: [Orders]
 *     summary: Ship an order (admin). PAID -> SHIPPED.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated order
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Order' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       422: { $ref: '#/components/responses/Unprocessable' }
 */
router.post(
  '/:id/ship',
  requireAdmin,
  validate({ params: idParamSchema }),
  asyncHandler(controller.ship)
);

/**
 * @swagger
 * /orders/{id}/deliver:
 *   post:
 *     tags: [Orders]
 *     summary: Mark an order as delivered (admin). SHIPPED -> DELIVERED.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated order
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Order' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       422: { $ref: '#/components/responses/Unprocessable' }
 */
router.post(
  '/:id/deliver',
  requireAdmin,
  validate({ params: idParamSchema }),
  asyncHandler(controller.deliver)
);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancel an order (owner or admin). Allowed only from PENDING or PAID.
 *     description: Restores stock and releases the coupon usage.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Canceled order
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Order' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       422: { $ref: '#/components/responses/Unprocessable' }
 */
router.post(
  '/:id/cancel',
  validate({ params: idParamSchema }),
  asyncHandler(controller.cancel)
);

export default router;
