import { getCustomerDisplayName } from "@/domain/customer/mappers/customerMappers";

const toFloatOrNull = (value) => (value ? parseFloat(value) : null);

export const mapContractFormToPayload = ({ data, customer, provider, calculatedData, pendingDocuments }) => ({
  customer_id: data.customer_id,
  customer_name: getCustomerDisplayName(customer),
  provider_id: data.provider_id,
  provider_name: provider?.name || "",
  category: data.category,
  start_date: data.start_date,
  end_date: calculatedData?.end_date || data.end_date || null,
  cancellation_deadline: calculatedData?.cancellation_deadline || data.cancellation_deadline || null,
  contract_duration_months: data.contract_duration_months,
  notice_period_days: data.notice_period_days,
  monthly_fee: toFloatOrNull(data.monthly_fee),
  commission: toFloatOrNull(data.commission),
  status: data.status,
  vvl_status: data.vvl_status,
  notes: data.notes,
  tariff_name: data.tariff_name || "",
  tariff_details: data.tariff_details || "",
  contract_number: data.contract_number || "",
  mobilfunk_type: data.mobilfunk_type || "",
  data_volume_gb: toFloatOrNull(data.data_volume_gb),
  has_allnet_flat: data.has_allnet_flat || false,
  has_sms_flat: data.has_sms_flat || false,
  has_roaming: data.has_roaming || false,
  connection_type: data.connection_type || "",
  speed_download_mbit: toFloatOrNull(data.speed_download_mbit),
  speed_upload_mbit: toFloatOrNull(data.speed_upload_mbit),
  router_included: data.router_included || false,
  router_model: data.router_model || "",
  tv_option: data.tv_option || "",
  ...(pendingDocuments ? { contract_documents: JSON.stringify(pendingDocuments) } : {})
});
