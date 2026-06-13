import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as controller from './cart.controller.js';
import { addItemSchema, productIdParamSchema, updateItemSchema } from './cart.schema.js';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get the authenticated user's cart
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Cart with items, subtotal and itemCount
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Cart' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', asyncHandler(controller.getCart));

/**
 * @swagger
 * /cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add an item to the cart (or increment if it already exists)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: string, example: "clxxxxxxxx0000abcd1234efgh" }
 *               quantity:  { type: integer, minimum: 1, example: 2 }
 *     responses:
 *       201:
 *         description: Updated cart
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Cart' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       422:
 *         description: Inactive product or insufficient stock
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/items', validate({ body: addItemSchema }), asyncHandler(controller.addItem));

/**
 * @swagger
 * /cart/items/{productId}:
 *   patch:
 *     tags: [Cart]
 *     summary: Update the quantity of a cart item (quantity=0 removes it)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer, minimum: 0 }
 *     responses:
 *       200:
 *         description: Updated cart
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Cart' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       422: { $ref: '#/components/responses/Unprocessable' }
 */
router.patch(
  '/items/:productId',
  validate({ params: productIdParamSchema, body: updateItemSchema }),
  asyncHandler(controller.updateItem)
);

/**
 * @swagger
 * /cart/items/{productId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove a single item from the cart
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated cart
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Cart' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete(
  '/items/:productId',
  validate({ params: productIdParamSchema }),
  asyncHandler(controller.removeItem)
);

/**
 * @swagger
 * /cart:
 *   delete:
 *     tags: [Cart]
 *     summary: Empty the cart
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Empty cart
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Cart' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.delete('/', asyncHandler(controller.clearCart));

export default router;
