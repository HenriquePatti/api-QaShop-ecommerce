import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env.js';

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'E-commerce API for QA Practice',
    version: '1.0.0',
    description: `
A e-commerce REST API designed as **a base for QA automated testing practice**
using Mocha + Chai + Supertest.

See \`README.md\` for the full list of testable business rules and credentials seeded
for development.
    `.trim(),
    contact: { name: 'QA Practice API' },
    license: { name: 'MIT' },
  },
  servers: [
    { url: `http://localhost:${env.PORT}`, description: 'Local development' },
  ],
  tags: [
    { name: 'Auth', description: 'Registration, login, current user' },
    { name: 'Users', description: 'User management (admin + self)' },
    { name: 'Categories', description: 'Product categorization' },
    { name: 'Products', description: 'Product catalog (search, filters, sort)' },
    { name: 'Cart', description: "Authenticated user's shopping cart" },
    { name: 'Coupons', description: 'Discount coupons (admin + validation)' },
    { name: 'Orders', description: 'Order lifecycle: create, pay, ship, deliver, cancel' },
    { name: 'Reviews', description: 'Product reviews tied to delivered orders' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the token returned by `POST /auth/login`',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Request validation failed' },
              details: { type: 'object', nullable: true },
            },
            required: ['code', 'message'],
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          pageSize: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 5 },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clxxxxxxxx0000abcd1234efgh' },
          name: { type: 'string', example: 'Alice' },
          email: { type: 'string', format: 'email', example: 'alice@test.com' },
          role: { type: 'string', enum: ['CUSTOMER', 'ADMIN'], example: 'CUSTOMER' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'Eletrônicos' },
          slug: { type: 'string', example: 'eletronicos' },
          description: { type: 'string', nullable: true },
          imageUrl: {
            type: 'string',
            format: 'uri',
            nullable: true,
            example:
              'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'Fone de Ouvido Bluetooth' },
          slug: { type: 'string', example: 'fone-bluetooth' },
          description: { type: 'string' },
          price: { type: 'number', format: 'float', example: 299.9 },
          stock: { type: 'integer', example: 25 },
          active: { type: 'boolean', example: true },
          imageUrl: {
            type: 'string',
            format: 'uri',
            nullable: true,
            example: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
          },
          categoryId: { type: 'string' },
          category: { $ref: '#/components/schemas/Category' },
          avgRating: { type: 'number', format: 'float', nullable: true, example: 4.5 },
          reviewsCount: { type: 'integer', example: 12 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CartItem: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          productId: { type: 'string' },
          quantity: { type: 'integer', example: 2 },
          unitPrice: { type: 'number', example: 199.9 },
          lineTotal: { type: 'number', example: 399.8 },
          product: { $ref: '#/components/schemas/Product' },
        },
      },
      Cart: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
          subtotal: { type: 'number', example: 599.7 },
          itemCount: { type: 'integer', example: 3 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Coupon: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          code: { type: 'string', example: 'WELCOME10' },
          type: { type: 'string', enum: ['PERCENTAGE', 'FIXED'] },
          value: { type: 'number', example: 10 },
          minOrderValue: { type: 'number', example: 0 },
          maxDiscount: { type: 'number', nullable: true },
          usageLimit: { type: 'integer', nullable: true },
          perUserLimit: { type: 'integer', example: 1 },
          validFrom: { type: 'string', format: 'date-time' },
          validUntil: { type: 'string', format: 'date-time' },
          active: { type: 'boolean' },
        },
      },
      CouponValidation: {
        type: 'object',
        properties: {
          valid: { type: 'boolean' },
          discount: { type: 'number', example: 25 },
          finalValue: { type: 'number', example: 225 },
          reason: { type: 'string', nullable: true },
        },
      },
      OrderItem: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          productId: { type: 'string' },
          productName: { type: 'string', description: 'Snapshot at order creation time' },
          unitPrice: { type: 'number', description: 'Snapshot at order creation time' },
          quantity: { type: 'integer' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          status: {
            type: 'string',
            enum: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'],
          },
          subtotal: { type: 'number' },
          discount: { type: 'number' },
          total: { type: 'number' },
          couponCode: { type: 'string', nullable: true },
          shippingAddress: { type: 'string' },
          items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
          paidAt: { type: 'string', format: 'date-time', nullable: true },
          shippedAt: { type: 'string', format: 'date-time', nullable: true },
          deliveredAt: { type: 'string', format: 'date-time', nullable: true },
          canceledAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Review: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          productId: { type: 'string' },
          orderId: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    responses: {
      ValidationError: {
        description: 'Request validation failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Unauthorized: {
        description: 'Missing/invalid/expired credentials',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Authenticated but lacking permissions',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Conflict: {
        description: 'Conflict with current state',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Unprocessable: {
        description: 'Business rule violation (stock, status, coupon, etc.)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
};

const options = {
  definition,
  apis: ['./src/modules/**/*.js'],
};

export const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
