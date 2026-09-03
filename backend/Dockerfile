# Multi-stage build — no native deps in package.json, so plain alpine is fine.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# main.ts writes ./openapi.json on boot — the non-root `node` user needs
# ownership of the whole working dir, not just dist/, for that to succeed.
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "dist/main"]
