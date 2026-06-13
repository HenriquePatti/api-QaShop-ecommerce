import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as controller from './reviews.controller.js';
import {
  createReviewSchema,
  idParamSchema,
  listQuerySchema,
  productIdParamSchema,
  updateReviewSchema,
} from './reviews.schema.js';

/**
 * Two routers:
 *   - productScoped — mounted under /products/:productId/reviews (list + create)
 *   - reviewScoped  — mounted under /reviews (update + delete)
 */

export const productScoped = Router({ mergeParams: true });

/**
 * @swagger
 * /products/{productId}/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: List reviews for a product (public, paginated)
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *     responses:
 *       200:
 *         description: Reviews list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Review' }
 *                 meta: { $ref: '#/components/schemas/Pagination' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
productScoped.get(
  '/',
  validate({ params: productIdParamSchema, query: listQuerySchema }),
  asyncHandler(controller.listForProduct)
);

/**
 * @swagger
 * /products/{productId}/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a review for a product (authenticated, one per product)
 *     description: |
 *       Requires `orderId` of a DELIVERED order belonging to the user that
 *       contains this product. Only one review per (user, product).
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
 *             required: [rating, orderId]
 *             properties:
 *               rating:  { type: integer, minimum: 1, maximum: 5, example: 5 }
 *               comment: { type: string, nullable: true, example: "Loved it!" }
 *               orderId: { type: string }
 *     responses:
 *       201:
 *         description: Review created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Review' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *       422: { $ref: '#/components/responses/Unprocessable' }
 */
productScoped.post(
  '/',
  authenticate,
  validate({ params: productIdParamSchema, body: createReviewSchema }),
  asyncHandler(controller.create)
);

export const reviewScoped = Router();

/**
 * @swagger
 * /reviews/{id}:
 *   patch:
 *     tags: [Reviews]
 *     summary: Update a review (author only — admins cannot edit content)
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
 *               rating:  { type: integer, minimum: 1, maximum: 5 }
 *               comment: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Updated review
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Review' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
reviewScoped.patch(
  '/:id',
  authenticate,
  validate({ params: idParamSchema, body: updateReviewSchema }),
  asyncHandler(controller.update)
);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete a review (author or admin)
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
reviewScoped.delete(
  '/:id',
  authenticate,
  validate({ params: idParamSchema }),
  asyncHandler(controller.remove)
);

export default { productScoped, reviewScoped };
