import { base44 } from "@/api/base44Client";
import { withApiErrorHandling } from "@/domain/common/errors";
import { parseTaskInput, parseTaskList } from "@/domain/task/model";

export const taskService = {
  list() {
    return withApiErrorHandling(async () => parseTaskList(await base44.entities.Task.list()), "Aufgaben konnten nicht geladen werden");
  },

  create(data) {
    const payload = parseTaskInput(data);
    return withApiErrorHandling(() => base44.entities.Task.create(payload), "Aufgabe konnte nicht erstellt werden");
  },

  update(id, data) {
    return withApiErrorHandling(() => base44.entities.Task.update(id, data), "Aufgabe konnte nicht aktualisiert werden");
  },

  updateStatus(id, status) {
    return this.update(id, { status });
  }
};
