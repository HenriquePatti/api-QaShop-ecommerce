import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.js';
import { validate as validateMw } from '../../middlewares/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as controller from './coupons.controller.js';
import {
  createCouponSchema,
  idParamSchema,
  updateCouponSchema,
  validateCouponSchema,
} from './coupons.schema.js';

const router = Router();

/**
 * @swagger
 * /coupons:
 *   get:
 *     tags: [Coupons]
 *     summary: List all coupons (admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All coupons
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Coupon' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/', authenticate, requireAdmin, asyncHandler(controller.listAll));

/**
 * @swagger
 * /coupons:
 *   post:
 *     tags: [Coupons]
 *     summary: Create a coupon (admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, type, value, validFrom, validUntil]
 *             properties:
 *               code:          { type: string, example: "SUMMER15" }
 *               type:          { type: string, enum: [PERCENTAGE, FIXED] }
 *               value:         { type: number, example: 15 }
 *               minOrderValue: { type: number, example: 0 }
 *               maxDiscount:   { type: number, nullable: true, example: 50 }
 *               usageLimit:    { type: integer, nullable: true, example: 100 }
 *               perUserLimit:  { type: integer, example: 1 }
 *               validFrom:     { type: string, format: date-time, example: "2026-01-01T00:00:00.000Z" }
 *               validUntil:    { type: string, format: date-time, example: "2026-12-31T23:59:59.000Z" }
 *               active:        { type: boolean, example: true }
 *     responses:
 *       201:
 *         description: Coupon created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Coupon' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateMw({ body: createCouponSchema }),
  asyncHandler(controller.create)
);

/**
 * @swagger
 * /coupons/{id}:
 *   patch:
 *     tags: [Coupons]
 *     summary: Update a coupon (admin)
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
 *           schema: { $ref: '#/components/schemas/Coupon' }
 *     responses:
 *       200:
 *         description: Updated coupon
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Coupon' }
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
  validateMw({ params: idParamSchema, body: updateCouponSchema }),
  asyncHandler(controller.update)
);

/**
 * @swagger
 * /coupons/{id}:
 *   delete:
 *     tags: [Coupons]
 *     summary: Delete a coupon (admin)
 *     description: Soft-deletes (active=false) when there are usages; hard-deletes otherwise.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Soft-deleted coupon
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Coupon' }
 *       204: { description: Hard-deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validateMw({ params: idParamSchema }),
  asyncHandler(controller.remove)
);

/**
 * @swagger
 * /coupons/validate:
 *   post:
 *     tags: [Coupons]
 *     summary: Validate a coupon for the authenticated user (does NOT consume a use)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, orderValue]
 *             properties:
 *               code:       { type: string, example: "WELCOME10" }
 *               orderValue: { type: number, example: 250 }
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CouponValidation' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post(
  '/validate',
  authenticate,
  validateMw({ body: validateCouponSchema }),
  asyncHandler(controller.validate)
);

export default router;
