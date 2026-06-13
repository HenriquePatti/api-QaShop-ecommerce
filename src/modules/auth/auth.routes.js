import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as controller from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schema.js';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new customer
 *     description: |
 *       Creates a new account with role `CUSTOMER`. Email must be unique.
 *       Password must be at least 8 chars and contain at least 1 uppercase
 *       letter and 1 number. The response includes a JWT ready to use.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: "Carol" }
 *               email:    { type: string, format: email, example: "carol@test.com" }
 *               password: { type: string, format: password, example: "Carol@123" }
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post(
  '/register',
  validate({ body: registerSchema }),
  asyncHandler(controller.register)
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate and receive a JWT
 *     description: Returns a token valid for the configured `JWT_EXPIRES_IN` (1h by default).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: "admin@test.com" }
 *               password: { type: string, example: "Admin@123" }
 *     responses:
 *       200:
 *         description: Logged in
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post(
  '/login',
  validate({ body: loginSchema }),
  asyncHandler(controller.login)
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/me', authenticate, asyncHandler(controller.me));

export default router;
