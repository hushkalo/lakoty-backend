FROM node:22-alpine as builder
WORKDIR /app
COPY package*.json .env ./
COPY prisma ./prisma

RUN npm install
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:22-alpine as renner

WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 8080

# Start the application
CMD ["npm", "run", "start:prod"]

