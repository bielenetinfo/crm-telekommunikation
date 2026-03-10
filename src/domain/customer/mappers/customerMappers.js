export const getCustomerDisplayName = (customer) => {
  if (!customer) return "";
  return customer.customer_type === "geschäftlich"
    ? customer.company_name || ""
    : `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
};

export const toCustomerSearchTokens = (customer) => {
  const lower = (value) => (value || "").toString().toLowerCase();
  return {
    firstName: lower(customer.first_name),
    lastName: lower(customer.last_name),
    company: lower(customer.company_name),
    email: lower(customer.email),
    phone: (customer.phone || "").toString(),
    whatsapp: (customer.whatsapp || "").toString(),
    address: lower(customer.address),
    city: lower(customer.city),
    postalCode: (customer.postal_code || "").toString(),
    branchName: lower(customer.branch_name),
    notes: lower(customer.notes)
  };
};
