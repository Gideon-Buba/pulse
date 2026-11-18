import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/**
 * Single definition of the OpenAPI document, shared by `main.ts` (which
 * serves it at /api/docs) and `scripts/generate-openapi.ts` (which writes
 * `openapi.json`, the file Gideon hands to Lovable). Two copies of this
 * config would be how `openapi.json` quietly stops matching the live UI.
 */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Pulse API')
    .setDescription('NRS TWG Initiative Tracker')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, config);
}
