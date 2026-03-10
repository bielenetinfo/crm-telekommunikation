import { z } from "zod";
import { ValidationError } from "@/domain/common/errors";

export const taskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  status: z.string().optional().nullable(),
  priority: z.string().optional().nullable(),
  customer_name: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  created_at: z.string().optional().nullable()
}).passthrough();

const taskInputSchema = taskSchema.omit({ id: true }).partial({
  status: true,
  priority: true,
  customer_name: true,
  due_date: true,
  created_at: true
});

export const parseTaskList = (items) => z.array(taskSchema).parse(items || []);

export const parseTaskInput = (data) => {
  const result = taskInputSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("Ungültige Aufgaben-Daten", { details: result.error.flatten() });
  }
  return result.data;
};
