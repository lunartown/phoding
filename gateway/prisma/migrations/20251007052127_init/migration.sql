-- CreateTable
CREATE TABLE "chat_logs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "operations" JSONB NOT NULL,
    "logs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_logs_sessionId_idx" ON "chat_logs"("sessionId");

-- CreateIndex
CREATE INDEX "chat_logs_createdAt_idx" ON "chat_logs"("createdAt");
