import { z } from "zod";
import { ValidationError } from "@/domain/common/errors";

export const customerSchema = z.object({
  id: z.string().optional(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
  customer_type: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  branch_name: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  created_date: z.string().optional().nullable()
}).passthrough();

export const parseCustomer = (data) => {
  const result = customerSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("Ungültige Kundendaten", { details: result.error.flatten() });
  }
  return result.data;
};

export const parseCustomerList = (items) => z.array(customerSchema).parse(items || []);
