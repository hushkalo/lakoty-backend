build:
	@echo "Building store project..."
	@npm run build:all
	@echo "Building store project done"

move-prisma-client:
	@echo "Moving prisma client..."
	@cp -R libs/prisma-client/src/generated dist/libs/prisma-client/src/generated
	@echo "Moving prisma client done"

format:
	@echo "Formatting code..."
	@npm run format

start-dev-admin:
	@echo "Starting server in development mode..."
	@npm run start:dev:admin

start-prod-admin:
	@echo "Starting server in development mode..."
	@npm run start:prod:admin

start-dev-store:
	@echo "Starting server in development mode..."
	@npm run start:dev:store

start-prod-store:
	@echo "Starting server in production mode..."
	@npm run start:prod:store

build-admin:
	@echo "Building admin project..."
	@npm run build:admin

build-store:
	@echo "Building store project..."
	@npm run build:store

lint:
	@echo "Linting code..."
	@npm run lint

prisma-migrate:
	@echo "Migrating database..."
	@npm run prisma:migrate

prisma-seed:
	@echo "Seeding data..."
	@npm run prisma:seed

prisma-generate:
	@echo "Generating prisma client..."
	@npm run prisma:generate
	@echo "Generating prisma client done"

.PHONY: build format start-dev-admin start-prod-admin start-dev-store start-prod-store lint prisma-generate prisma-migrate prisma-seed