-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "character" TEXT NOT NULL DEFAULT 'mario',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pomodoro_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "ended_at" TIMESTAMPTZ(6) NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL,
    "character" TEXT NOT NULL DEFAULT 'mario',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pomodoro_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "pomodoro_sessions_user_id_started_at_idx" ON "pomodoro_sessions"("user_id", "started_at");

-- AddForeignKey
ALTER TABLE "pomodoro_sessions" ADD CONSTRAINT "pomodoro_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
