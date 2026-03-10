import { z } from "zod";
import { ValidationError } from "@/domain/common/errors";

export const contractSchema = z.object({
  id: z.string().optional(),
  customer_id: z.string().optional().nullable(),
  customer_name: z.string().optional().nullable(),
  provider_id: z.string().optional().nullable(),
  provider_name: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  cancellation_deadline: z.string().optional().nullable(),
  contract_duration_months: z.number().optional().nullable(),
  notice_period_days: z.number().optional().nullable(),
  monthly_fee: z.number().optional().nullable(),
  commission: z.number().optional().nullable(),
  status: z.string().optional().nullable(),
  vvl_status: z.string().optional().nullable(),
  contract_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_deleted: z.boolean().optional().nullable()
}).passthrough();

export const tasklessContractInputSchema = contractSchema.omit({ id: true }).passthrough();

export const parseContract = (data) => {
  const result = contractSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("Ungültige Vertragsdaten", { details: result.error.flatten() });
  }
  return result.data;
};

export const parseContractInput = (data) => {
  const result = tasklessContractInputSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("Ungültige Vertrags-Eingabedaten", { details: result.error.flatten() });
  }
  return result.data;
};

export const parseContractList = (items) => z.array(contractSchema).parse(items || []);
