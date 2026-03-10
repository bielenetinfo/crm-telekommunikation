import { useEffect, useState } from "react";

const initialCustomerForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  city: "",
  postal_code: "",
  birth_date: "",
  customer_type: "privat",
  branch_id: "",
  notes: ""
};

export function useCustomerForm(customer) {
  const [formData, setFormData] = useState(initialCustomerForm);

  useEffect(() => {
    if (!customer) {
      setFormData(initialCustomerForm);
      return;
    }

    setFormData({
      first_name: customer.first_name || "",
      last_name: customer.last_name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      whatsapp: customer.whatsapp || "",
      address: customer.address || "",
      city: customer.city || "",
      postal_code: customer.postal_code || "",
      birth_date: customer.birth_date || "",
      customer_type: customer.customer_type || "privat",
      branch_id: customer.branch_id || "",
      notes: customer.notes || ""
    });
  }, [customer]);

  return { formData, setFormData };
}
