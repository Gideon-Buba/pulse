import 'reflect-metadata';
import { writeFileSync } from 'fs';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Permissive for now so local dev tools (e.g. dev-test-ui.html opened via
  // file://) and the eventual Lovable frontend can both call the API during
  // development. Scope this down to the real frontend origin before prod.
  app.enableCors();

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
