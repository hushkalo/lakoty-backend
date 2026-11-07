# syntax=docker/dockerfile:1

############################################
# Base
############################################
FROM node:20.19.3-alpine AS base
WORKDIR /app
# openssl потрібен prisma query engine, libstdc++ - нативним модулям (bcrypt)
RUN apk add --no-cache openssl libstdc++
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

############################################
# Всі залежності (з інструментами для нативних модулів)
############################################
FROM base AS deps
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

############################################
# Збірка admin + store
############################################
FROM deps AS builder
COPY . .
RUN npm run prisma:generate \
 && npm run build:all \
 && mkdir -p dist/libs/prisma-client/src/generated \
 && cp -R libs/prisma-client/src/generated/. dist/libs/prisma-client/src/generated/

############################################
# Runtime-залежності конкретного застосунку
############################################
FROM deps AS prod-deps
ARG APP
COPY --from=builder /app/dist/apps/${APP}/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund

############################################
# Фінальний образ застосунку
############################################
FROM base AS runner
ARG APP
ENV APP=${APP} \
    NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist/apps/${APP} ./dist/apps/${APP}
# Prisma query engine має лежати там само, де й локально (див. Makefile: move-prisma-client)
COPY --from=builder /app/dist/libs/prisma-client/src/generated ./dist/libs/prisma-client/src/generated
COPY --from=builder /app/libs/prisma-client/src/generated ./libs/prisma-client/src/generated

RUN chown -R node:node /app
USER node

CMD ["sh", "-c", "node dist/apps/${APP}/main.js"]

############################################
# Одноразовий сервіс міграцій (prisma migrate deploy)
############################################
FROM deps AS migrator
COPY libs/prisma-schema ./libs/prisma-schema
CMD ["npx", "prisma", "migrate", "deploy", "--schema=libs/prisma-schema/prisma/schema.prisma"]

############################################
# Одноразовий сервіс сиду (prisma db seed -> ts-node seed.ts)
############################################
FROM deps AS seeder
COPY tsconfig.json ./
COPY libs ./libs
# seed.ts імпортує утиліти з admin (transliteration, bcrypt)
COPY apps/admin/src ./apps/admin/src
# згенерований клієнт з правильним engine під alpine/musl
COPY --from=builder /app/libs/prisma-client/src/generated ./libs/prisma-client/src/generated
CMD ["npx", "prisma", "db", "seed"]
