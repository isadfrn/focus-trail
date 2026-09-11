FROM node:24-slim AS deps
WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npm prune --omit=dev \
  && npx prisma generate

FROM node:24-slim AS runtime
WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/* \
  && chown -R node:node /app
ENV NODE_ENV=production
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=deps --chown=node:node /app/package.json ./package.json
COPY --from=deps --chown=node:node /app/package-lock.json ./package-lock.json
COPY --from=deps --chown=node:node /app/prisma ./prisma
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node src ./src
USER node
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
