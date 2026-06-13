import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';

import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import categoriesRoutes from './modules/categories/categories.routes.js';
import productsRoutes from './modules/products/products.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import couponsRoutes from './modules/coupons/coupons.routes.js';
import ordersRoutes from './modules/orders/orders.routes.js';
import { productScoped as productReviewsRoutes, reviewScoped as reviewsRoutes } from './modules/reviews/reviews.routes.js';

const app = express();

// Hardening + ergonomics
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false })); // disabled CSP so Swagger UI loads
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Lightweight liveness probe — handy for QA scripts and CI
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Swagger
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'E-commerce API for QA Practice',
    customCss: '.topbar { display: none }',
  })
);

// Routes
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/categories', categoriesRoutes);
app.use('/products', productsRoutes);
app.use('/products/:productId/reviews', productReviewsRoutes);
app.use('/cart', cartRoutes);
app.use('/coupons', couponsRoutes);
app.use('/orders', ordersRoutes);
app.use('/reviews', reviewsRoutes);

app.get('/', (_req, res) => {
  res.json({
    name: 'E-commerce API for QA Practice',
    version: '1.0.0',
    docs: '/api/docs',
    health: '/health',
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
