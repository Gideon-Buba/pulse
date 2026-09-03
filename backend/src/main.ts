import 'reflect-metadata';
import { writeFileSync } from 'fs';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Locked to FRONTEND_URL (comma-separated for multiple deploy URLs — e.g. the
  // Vercel production domain plus its preview-deployment domain) once set. Left
  // permissive when unset so local dev tools (e.g. dev-test-ui.html opened via
  // file://) can still call the API without extra setup.
  const allowedOrigins = process.env.FRONTEND_URL?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Pulse API')
    .setDescription('NRS TWG Initiative Tracker')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Static OpenAPI spec — this is the file Gideon hands to Lovable as the
  // API contract. Regenerate on every shape change; a stale copy is a bug.
  writeFileSync('./openapi.json', JSON.stringify(document, null, 2));

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start Pulse API:', error);
  process.exit(1);
});
