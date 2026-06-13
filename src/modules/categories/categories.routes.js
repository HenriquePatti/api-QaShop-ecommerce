import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as controller from './categories.controller.js';
import {
  createCategorySchema,
  idParamSchema,
  slugParamSchema,
  updateCategorySchema,
} from './categories.schema.js';

const router = Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: List all categories (public)
 *     responses:
 *       200:
 *         description: Categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Category' }
 */
router.get('/', asyncHandler(controller.listAll));

/**
 * @swagger
 * /categories/{slug}:
 *   get:
 *     tags: [Categories]
 *     summary: Get a category by slug (public)
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Category' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:slug', validate({ params: slugParamSchema }), asyncHandler(controller.getBySlug));

/**
 * @swagger
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a category (admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:        { type: string, example: "Toys" }
 *               slug:        { type: string, example: "toys", description: "Optional. Auto-derived from name when omitted." }
 *               description: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Category created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Category' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate({ body: createCategorySchema }),
  asyncHandler(controller.create)
);

/**
 * @swagger
 * /categories/{id}:
 *   patch:
 *     tags: [Categories]
 *     summary: Update a category (admin)
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
 *               description: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Updated category
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Category' }
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
  validate({ params: idParamSchema, body: updateCategorySchema }),
  asyncHandler(controller.update)
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category (admin)
 *     description: Returns 409 if the category has associated products.
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
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ params: idParamSchema }),
  asyncHandler(controller.remove)
);

export default router;
