build:
	@echo "Building project..."
	@npm run build

format:
	@echo "Formatting code..."
	@npm run format

start:
	@echo "Starting server..."
	@npm run start

start-dev:
	@echo "Starting server in development mode..."
	@npm run start:dev

start-debug:
	@echo "Starting server in debug mode..."
	@npm run start:debug

start-prod:
	@echo "Starting server in production mode..."
	@npm run start:prod

lint:
	@echo "Linting code..."
	@npm run lint

migrate-dev:
	@echo "Migrating database..."
	@npm run prisma-generate:dev

migrate-prod:
	@echo "Migrating database..."
	@npm run prisma-generate:prod

migrate-seed:
	@echo "Seeding data..."
	@npx prisma db seed

create-docker-container:
	@echo "Creating backend container..."
	@docker-compose up --build -d
generate-prisma:
	@echo "Generating prisma client..."
	@npx prisma generate
create-docker-db:
	@echo "Creating database container..."
	@docker-compose -f docker-compose.db.yml up -d
create-docker-app:
	@echo "Creating redis container..."
	@docker-compose -f docker-compose.app.yml up -d

.PHONY: build format start start-dev start-debug start-prod lint migrate-dev migrate-prod migrate-seed create-docker-container generate-prisma create-docker-db create-docker-app