import { base44 } from "@/api/base44Client";
import { withApiErrorHandling } from "@/domain/common/errors";
import { parseCustomer, parseCustomerList } from "@/domain/customer/model";
import { toCustomerSearchTokens } from "@/domain/customer/mappers/customerMappers";

export const customerService = {
  list(order = "-created_date") {
    return withApiErrorHandling(async () => {
      const items = await base44.entities.Customer.list(order);
      return parseCustomerList(items);
    }, "Kunden konnten nicht geladen werden");
  },

  async create(data) {
    const payload = parseCustomer(data);
    return withApiErrorHandling(async () => parseCustomer(await base44.entities.Customer.create(payload)), "Kunde konnte nicht erstellt werden");
  },

  async update(id, data) {
    const payload = parseCustomer(data);
    return withApiErrorHandling(async () => parseCustomer(await base44.entities.Customer.update(id, payload)), "Kunde konnte nicht aktualisiert werden");
  },

  async remove(id) {
    return withApiErrorHandling(async () => base44.entities.Customer.delete(id), "Kunde konnte nicht gelöscht werden");
  },

  filterBySearch(customers, search) {
    const normalized = (search || "").toLowerCase();
    return customers.filter((customer) => {
      const token = toCustomerSearchTokens(customer);
      return token.firstName.includes(normalized) ||
        token.lastName.includes(normalized) ||
        token.company.includes(normalized) ||
        token.email.includes(normalized) ||
        token.phone.includes(search || "") ||
        token.whatsapp.includes(search || "") ||
        token.address.includes(normalized) ||
        token.city.includes(normalized) ||
        token.postalCode.includes(search || "") ||
        token.branchName.includes(normalized) ||
        token.notes.includes(normalized);
    });
  }
};
