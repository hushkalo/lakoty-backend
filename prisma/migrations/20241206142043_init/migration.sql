-- CreateTable
CREATE TABLE "ServerStatus"
(
    "id"        TEXT         NOT NULL,
    "status"    TEXT         NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerStatus_pkey" PRIMARY KEY ("id")
);
