import type { DurationOp, SessionFilters, SessionType } from "../types/session";

export function dayRange(dateStr: string): { from: string; to: string } {
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

export interface FilterForm {
  date: string;
  type: "" | SessionType;
  task: string;
  status: "" | "completed" | "interrupted";
  durationOp: "" | DurationOp;
  durationMinutes: string;
}

export const emptyFilterForm: FilterForm = {
  date: "",
  type: "",
  task: "",
  status: "",
  durationOp: "",
  durationMinutes: "",
};

export function buildSessionFilters(form: FilterForm): SessionFilters {
  const filters: SessionFilters = {};

  if (form.date) {
    const { from, to } = dayRange(form.date);
    filters.from = from;
    filters.to = to;
  }
  if (form.type) filters.type = form.type;
  const trimmedTask = form.task.trim();
  if (trimmedTask) filters.task = trimmedTask;
  if (form.status) filters.completed = form.status === "completed";
  if (form.durationOp && form.durationMinutes !== "") {
    const minutes = Number(form.durationMinutes);
    if (Number.isFinite(minutes) && minutes >= 0) {
      filters.durationOp = form.durationOp;
      filters.durationSeconds = Math.round(minutes * 60);
    }
  }

  return filters;
}
