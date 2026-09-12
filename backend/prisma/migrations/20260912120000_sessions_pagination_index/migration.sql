-- DropIndex
DROP INDEX "pomodoro_sessions_user_id_started_at_idx";

-- CreateIndex
CREATE INDEX "pomodoro_sessions_user_id_started_at_id_idx" ON "pomodoro_sessions"("user_id", "started_at", "id");
