import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as controller from './users.controller.js';
import { idParamSchema, listQuerySchema, updateUserSchema } from './users.schema.js';

// NOTE: `/me/stats` MUST be declared before `/:id` so Express does not match
// the literal string `me` against the dynamic param.

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List users (admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/User' }
 *                 meta: { $ref: '#/components/schemas/Pagination' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
  validate({ query: listQuerySchema }),
  asyncHandler(controller.list)
);

/**
 * @swagger
 * /users/me/stats:
 *   get:
 *     tags: [Users]
 *     summary: Aggregated stats for the authenticated user
 *     description: |
 *       Returns counts and total spent for the current user. Powers UI banners
 *       like "primeiro pedido com frete grátis".
 *
 *       - `ordersCount`: total orders, **including CANCELED**.
 *       - `deliveredCount`: orders currently in DELIVERED status.
 *       - `totalSpent`: sum of `total` of orders in PAID, SHIPPED or DELIVERED
 *         status (excludes PENDING and CANCELED).
 *       - `isFirstPurchase`: `true` when the user has never placed any order.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: User stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ordersCount:     { type: integer, example: 0 }
 *                 deliveredCount:  { type: integer, example: 0 }
 *                 totalSpent:      { type: number,  example: 0 }
 *                 isFirstPurchase: { type: boolean, example: true }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/me/stats', authenticate, asyncHandler(controller.getMyStats));

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by id (admin or self)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get(
  '/:id',
  authenticate,
  validate({ params: idParamSchema }),
  asyncHandler(controller.getById)
);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update a user (self or admin)
 *     description: Cannot change `role` via this endpoint.
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
 *               name:  { type: string, example: "Carol Updated" }
 *               email: { type: string, format: email, example: "carol2@test.com" }
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.patch(
  '/:id',
  authenticate,
  validate({ params: idParamSchema, body: updateUserSchema }),
  asyncHandler(controller.update)
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user (admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
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
