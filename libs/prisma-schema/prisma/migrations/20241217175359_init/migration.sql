-- AlterTable
ALTER TABLE "User"
    ALTER COLUMN "firstName" DROP NOT NULL,
    ALTER COLUMN "lastName" DROP NOT NULL,
    ALTER COLUMN "phoneNumber" DROP NOT NULL;
