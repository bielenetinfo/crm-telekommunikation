import { useEffect, useState } from "react";
import { addMonths, format } from "date-fns";

const initialContractForm = {
  customer_id: "",
  provider_id: "",
  branch_id: "",
  contract_number: "",
  category: "mobilfunk",
  contract_type: "",
  start_date: "",
  end_date: "",
  cancellation_period_months: 3,
  monthly_fee: "",
  total_commission: "",
  status: "aktiv",
  auto_renew: true,
  notes: ""
};

export function useContractForm(contract, { customers = [] } = {}) {
  const [formData, setFormData] = useState(initialContractForm);

  useEffect(() => {
    if (!contract) {
      setFormData(initialContractForm);
      return;
    }

    setFormData({
      customer_id: contract.customer_id || "",
      provider_id: contract.provider_id || "",
      branch_id: contract.branch_id || "",
      contract_number: contract.contract_number || "",
      category: contract.category || "mobilfunk",
      contract_type: contract.contract_type || "",
      start_date: contract.start_date || "",
      end_date: contract.end_date || "",
      cancellation_period_months: contract.cancellation_period_months || 3,
      monthly_fee: contract.monthly_fee || "",
      total_commission: contract.total_commission || "",
      status: contract.status || "aktiv",
      auto_renew: contract.auto_renew !== false,
      notes: contract.notes || ""
    });
  }, [contract]);

  const selectCustomer = (customerId) => {
    const customer = customers.find((entry) => entry.id === customerId);
    setFormData((current) => ({ ...current, customer_id: customerId, branch_id: customer?.branch_id || current.branch_id }));
  };

  const setStartDate = (startDate) => {
    if (startDate && formData.cancellation_period_months) {
      const endDate = addMonths(new Date(startDate), 24);
      setFormData((current) => ({ ...current, start_date: startDate, end_date: format(endDate, "yyyy-MM-dd") }));
      return;
    }

    setFormData((current) => ({ ...current, start_date: startDate }));
  };

  return { formData, setFormData, selectCustomer, setStartDate };
}
