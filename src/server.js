import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

const server = app.listen(env.PORT, () => {
  // morgan handles request logging; this single startup line is allowed.
  process.stdout.write(
    `E-commerce QA API listening on http://localhost:${env.PORT} (env=${env.NODE_ENV})\n` +
      `Swagger UI: http://localhost:${env.PORT}/api/docs\n`
  );
});

async function shutdown(signal) {
  process.stdout.write(`\nReceived ${signal}, shutting down gracefully...\n`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
