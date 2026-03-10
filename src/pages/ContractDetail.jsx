import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, AlertTriangle, Clock, RefreshCw, Target, FileX, CheckCircle2, Upload, FileText, Trash2, Download } from "lucide-react";
import { format, addMonths, addDays, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getContractPriority, getPriorityColor } from "@/components/utils/contractPriority";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VvlWizard from "@/components/contracts/VvlWizard";
import HistoryPreview from "@/components/history/HistoryPreview";
import QuickAddModal from "@/components/history/QuickAddModal";
import CancellationModal from "@/components/contracts/CancellationModal";
import { logContractCreated, logContractUpdated, logVvlStarted, logVvlCompleted } from "@/components/utils/historyLogger";
import ContractFormFields from "@/components/contracts/ContractFormFields";
import ContractDocuments from "@/components/contracts/ContractDocuments";
import { generateContractPDF, getContractFileName } from "@/components/pdf/contractPdf";
import { downloadBlob, createBlobURL, revokeBlobURL } from "@/components/pdf/downloadHelper";
import { toast } from "sonner";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { getContractStatusTransitionIssues, validateContractData } from "@/lib/validators";
import { CONTRACT_STATUS, CONTRACT_STATUS_OPTIONS } from "@/lib/statusEnums";
import { motion } from "framer-motion";
import { contractService } from "@/domain/contract/service";
import { customerService } from "@/domain/customer/service";
import { mapContractFormToPayload } from "@/domain/contract/mappers/contractMappers";
import { toApiError } from "@/domain/common/errors";

const pageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const DEFAULT_NOTICE_PERIOD_DAYS = 30;

export default function ContractDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const urlParams = new URLSearchParams(window.location.search);
  const contractId = urlParams.get('id');
  const isNew = urlParams.get('new') === 'true';
  const preselectedCustomerId = urlParams.get('customer_id');
  const justCreated = urlParams.get('created') === 'true';

  const [formData, setFormData] = useState({
    customer_id: preselectedCustomerId || "",
    provider_id: "",
    category: "mobilfunk",
    start_date: "",
    contract_duration_months: 24,
    notice_period_days: DEFAULT_NOTICE_PERIOD_DAYS,
    monthly_fee: "",
    commission: "",
    status: CONTRACT_STATUS.ACTIVE,
    vvl_status: "offen",
    notes: "",
    tariff_name: "",
    tariff_details: "",
    contract_number: "",
    mobilfunk_type: "hauptkarte",
    data_volume_gb: "",
    has_allnet_flat: false,
    has_sms_flat: false,
    has_roaming: false,
    connection_type: "",
    speed_download_mbit: "",
    speed_upload_mbit: "",
    router_included: false,
    router_model: "",
    tv_option: ""
  });

  const [showQuickAddHistory, setShowQuickAddHistory] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showVvlWizard, setShowVvlWizard] = useState(false);
  const [lastVvlRecord, setLastVvlRecord] = useState(null);
  const [uploadingContract, setUploadingContract] = useState(false);
  const [pendingDocuments, setPendingDocuments] = useState([]);

  const [calculatedData, setCalculatedData] = useState({
    end_date: null,
    cancellation_deadline: null
  });
  const [errors, setErrors] = useState({});
  const [initialStatus, setInitialStatus] = useState(CONTRACT_STATUS.ACTIVE);

  const { data: contract } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: async () => {
      return contractService.getById(contractId);
    },
    enabled: !!contractId && !isNew
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.list()
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => contractService.listProviders()
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => contractService.listBranches()
  });

  const { data: followups = [] } = useQuery({
    queryKey: ['followups', contractId],
    queryFn: async () => {
      return contractService.getFollowups(contractId);
    },
    enabled: !!contractId && !isNew
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', contractId],
    queryFn: async () => {
      return contractService.getActivities(contractId);
    },
    enabled: !!contractId && !isNew
  });

  const { data: customerHistory = [] } = useQuery({
    queryKey: ['customerHistory', contract?.customer_id],
    queryFn: async () => {
      return contractService.getCustomerHistory(contract.customer_id);
    },
    enabled: !!contract?.customer_id && !isNew
  });

  // Fetch last VVL record
  useEffect(() => {
    const fetchLastVvl = async () => {
      if (contract?.last_vvl_id) {
        try {
          const record = await contractService.getVvlRecordById(contract.last_vvl_id);
          setLastVvlRecord(record || null);
        } catch (error) {
          console.error('Failed to fetch VVL record:', error);
        }
      } else {
        setLastVvlRecord(null);
      }
    };
    if (!isNew && contract) {
      fetchLastVvl();
    }
  }, [contract?.last_vvl_id, isNew, contract]);

  // Auto-calculate dates
  useEffect(() => {
    const calculated = { end_date: null, cancellation_deadline: null };

    if (formData.start_date && formData.contract_duration_months) {
      try {
        calculated.end_date = format(
          addMonths(new Date(formData.start_date), formData.contract_duration_months),
          'yyyy-MM-dd'
        );
        calculated.cancellation_deadline = format(
          addDays(new Date(calculated.end_date), -(formData.notice_period_days || DEFAULT_NOTICE_PERIOD_DAYS)),
          'yyyy-MM-dd'
        );
      } catch (e) {
        console.error('Date calculation error:', e);
      }
    }

    setCalculatedData(calculated);
  }, [formData.start_date, formData.contract_duration_months, formData.notice_period_days]);

  useEffect(() => {
    if (contract) {
      let duration = 24;
      try {
        if (contract.start_date && contract.end_date) {
          const start = new Date(contract.start_date);
          const end = new Date(contract.end_date);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
            duration = diffMonths || 24;
          }
        }
      } catch (e) {
        console.error("Error parsing dates:", e);
      }

      setInitialStatus(contract.status || CONTRACT_STATUS.ACTIVE);
      setFormData({
        customer_id: contract.customer_id || "",
        provider_id: contract.provider_id || "",
        category: contract.category || "mobilfunk",
        start_date: contract.start_date || "",
        contract_duration_months: duration,
        notice_period_days: contract.notice_period_days || DEFAULT_NOTICE_PERIOD_DAYS,
        monthly_fee: contract.monthly_fee || "",
        commission: contract.commission || "",
        status: contract.status || CONTRACT_STATUS.ACTIVE,
        vvl_status: contract.vvl_status || "offen",
        notes: contract.notes || "",
        tariff_name: contract.tariff_name || "",
        tariff_details: contract.tariff_details || "",
        contract_number: contract.contract_number || "",
        mobilfunk_type: contract.mobilfunk_type || "",
        data_volume_gb: contract.data_volume_gb || "",
        has_allnet_flat: contract.has_allnet_flat || false,
        has_sms_flat: contract.has_sms_flat || false,
        has_roaming: contract.has_roaming || false,
        connection_type: contract.connection_type || "",
        speed_download_mbit: contract.speed_download_mbit || "",
        speed_upload_mbit: contract.speed_upload_mbit || "",
        router_included: contract.router_included || false,
        router_model: contract.router_model || "",
        tv_option: contract.tv_option || ""
      });
    }
  }, [contract]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const customer = customers.find(c => c.id === data.customer_id);
      const provider = providers.find(p => p.id === data.provider_id);

      const payload = mapContractFormToPayload({ data, customer, provider, calculatedData, pendingDocuments });
      const newContract = await contractService.create(payload);

      await contractService.createActivity({
        type: 'contract_created',
        customer_id: data.customer_id,
        customer_name: customer ? (customer.customer_type === "geschäftlich" ? customer.company_name : `${customer.first_name} ${customer.last_name}`) : "",
        contract_id: newContract.id,
        short_text: `Vertrag erstellt: ${provider?.name || ''} ${data.category}`
      });

      // Log to customer history
      await logContractCreated(
        data.customer_id,
        customer ? (customer.customer_type === "geschäftlich" ? customer.company_name : `${customer.first_name} ${customer.last_name}`) : "",
        newContract.id,
        provider?.name || "",
        data.category
      );

      return newContract;
    },
    onSuccess: (newContract) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      navigate(`${createPageUrl('ContractDetail')}?id=${newContract.id}&created=true`, { replace: true });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const customer = customers.find(c => c.id === data.customer_id);
      const provider = providers.find(p => p.id === data.provider_id);

      const payload = mapContractFormToPayload({ data, customer, provider, calculatedData });
      await contractService.update(contractId, payload);

      await contractService.createActivity({
        type: 'contract_updated',
        customer_id: data.customer_id,
        customer_name: contract.customer_name,
        contract_id: contractId,
        short_text: `Vertrag aktualisiert`
      });

      await logContractUpdated(
        data.customer_id,
        contract.customer_name,
        contractId,
        "Vertragsdaten wurden geändert"
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    }
  });

  const startVvlMutation = useMutation({
    mutationFn: async () => {
      await contractService.update(contractId, {
        vvl_status: 'in_bearbeitung',
        vvl_started_at: format(new Date(), 'yyyy-MM-dd')
      });

      const existingOpenFollowup = followups.find(f => f.status === 'open');
      if (!existingOpenFollowup) {
        await contractService.createFollowup({
          contract_id: contractId,
          customer_id: contract.customer_id,
          customer_name: contract.customer_name,
          provider_name: contract.provider_name,
          due_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
          type: 'call',
          note: 'VVL-Gespräch durchführen',
          status: 'open'
        });
      }

      await contractService.createActivity({
        type: 'vvl_started',
        customer_id: contract.customer_id,
        customer_name: contract.customer_name,
        contract_id: contractId,
        short_text: `VVL gestartet`
      });

      await logVvlStarted(
        contract.customer_id,
        contract.customer_name,
        contractId,
        contract.provider_name
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['followups', contractId] });
      queryClient.invalidateQueries({ queryKey: ['activities', contractId] });
    }
  });

  const completeVvlMutation = useMutation({
    mutationFn: async ({ outcome, notes }) => {
      await contractService.update(contractId, {
        vvl_status: outcome,
        status: outcome === 'verlängert' ? 'verlängert' : contract.status
      });

      await contractService.createActivity({
        type: 'followup_completed',
        customer_id: contract.customer_id,
        customer_name: contract.customer_name,
        contract_id: contractId,
        short_text: `VVL abgeschlossen: ${outcome}${notes ? ' • ' + notes : ''}`
      });

      await logVvlCompleted(
        contract.customer_id,
        contract.customer_name,
        contractId,
        outcome
      );

      const openFollowups = followups.filter(f => f.status === 'open');
      for (const f of openFollowups) {
        await contractService.updateFollowup(f.id, { status: 'done', vvl_action: outcome });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['followups', contractId] });
      queryClient.invalidateQueries({ queryKey: ['activities', contractId] });
    }
  });

  const focusFirstError = (errorMap) => {
    const order = ["customer_id", "contract_number", "contract_duration_months", "category"];
    const first = order.find((k) => errorMap[k]);
    if (first) {
      setTimeout(() => {
        const el = document.getElementById(first) || document.querySelector(`[name=\"${first}\"]`);
        if (el?.focus) el.focus();
      }, 0);
    }
  };

  const validateContractForm = () => {
    const newErrors = {};
    if (!formData.customer_id) newErrors.customer_id = "Kunde auswählen";
    if (!formData.contract_number?.trim()) newErrors.contract_number = "Vertragsnummer ist Pflicht";
    if (!formData.contract_duration_months) newErrors.contract_duration_months = "Laufzeit wählen";
    if (!formData.category) newErrors.category = "Kategorie auswählen";

    const selectedCustomer = customers.find(c => c.id === formData.customer_id);
    const transitionIssues = getContractStatusTransitionIssues(initialStatus, formData.status, {
      dsgvo_document_url: selectedCustomer?.dsgvo_document_url,
      tariff_name: formData.tariff_name,
      contract_duration_months: formData.contract_duration_months
    });

    if (transitionIssues.length > 0) {
      newErrors.status = transitionIssues.join(', ');
    }

    try {
      validateContractData({
        contract_number: formData.contract_number,
        tariff_name: formData.tariff_name,
        tariff_details: formData.tariff_details
      });
    } catch (err) {
      const msg = err?.message || "";
      if (!newErrors.contract_number && msg.toLowerCase().includes("vertragsnummer")) {
        newErrors.contract_number = msg;
      }
      if (!newErrors.tariff_name && msg.toLowerCase().includes("tarifname")) {
        newErrors.tariff_name = msg;
      }
    }
    return newErrors;
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      const { [field]: _, ...rest } = errors;
      setErrors(rest);
    }
  };

  const handleSave = async () => {
    const validationErrors = validateContractForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      focusFirstError(validationErrors);
      toast.error("Bitte Pflichtfelder prüfen");
      return;
    }
    setErrors({});

    try {
      if (isNew) {
        await createMutation.mutateAsync(formData);
      } else {
        await updateMutation.mutateAsync(formData);
      }
    } catch (error) {
      const apiError = toApiError(error, "Speichern fehlgeschlagen");
      toast.error(apiError.message);
    }
  };

  const handleNewContractDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingContract(true);
    try {
      const { file_url } = await contractService.uploadFile(file);

      const newDoc = {
        url: file_url,
        name: file.name,
        date: new Date().toISOString(),
        type: 'contract'
      };

      setPendingDocuments([...pendingDocuments, newDoc]);
      toast.success('Dokument bereit zum Hochladen');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload fehlgeschlagen');
    }
    setUploadingContract(false);
    e.target.value = '';
  };

  const handleRemovePendingDocument = (index) => {
    setPendingDocuments(pendingDocuments.filter((_, i) => i !== index));
  };

  const priority = contract && !isNew ? getContractPriority(contract, followups, new Date()) : null;
  const colors = priority ? getPriorityColor(priority.level) : null;
  const selectedCustomer = customers.find(c => c.id === formData.customer_id);
  const contractChecklist = [
    { key: "dsgvo", label: "DSGVO vorhanden", complete: !!selectedCustomer?.dsgvo_document_url },
    { key: "tariff", label: "Produkt/Tarif gesetzt", complete: !!formData.tariff_name?.trim() },
    { key: "duration", label: "Laufzeit gesetzt", complete: !!formData.contract_duration_months }
  ];

  const createHistoryMutation = useMutation({
    mutationFn: async (data) => {
      const customer = customers.find(c => c.id === contract.customer_id);
      const customerName = customer?.customer_type === "geschäftlich"
        ? customer.company_name
        : `${customer.first_name} ${customer.last_name}`;

      return contractService.createCustomerHistory({
        customer_id: contract.customer_id,
        customer_name: customerName,
        type: data.type,
        title: data.title,
        notes: data.notes || "",
        channel: data.channel || "store",
        status: data.due_at ? "open" : "done",
        occurred_at: new Date().toISOString(),
        due_at: data.due_at || null,
        contract_id: contractId,
        priority: data.priority || "medium",
        tags: "[]",
        is_system_event: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerHistory'] });
    }
  });

  const deleteContractMutation = useMutation({
    mutationFn: async () => {
      // Log deletion to history first
      await contractService.createCustomerHistory({
        customer_id: contract.customer_id,
        customer_name: contract.customer_name,
        type: 'system',
        title: 'Vertrag gelöscht',
        notes: `${contract.provider_name} • ${contract.category} • ${contract.tariff_name || 'ohne Tarifnamen'}`,
        channel: 'store',
        status: 'done',
        occurred_at: new Date().toISOString(),
        contract_id: contractId,
        priority: 'low',
        tags: JSON.stringify(['löschen']),
        is_system_event: true
      });

      await contractService.update(contractId, {
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        status: 'abgelaufen'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Vertrag gelöscht');
      navigate(-1);
    }
  });

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="app-detail-shell lg:space-y-10"
    >
      {/* Header - Dashboard Pattern */}
      <div className="app-form-panel p-3 sm:p-4 md:p-5 flex flex-wrap items-start gap-3 md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-11 w-11 md:h-12 md:w-12 rounded-2xl bg-secondary/50 border border-secondary hover:bg-secondary transition-all flex-shrink-0"
        >
          <ArrowLeft className="h-6 w-6 text-muted-foreground" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="app-page-title">
            {isNew ? "Neuer Vertrag" : (contract?.provider_name || 'Vertrag')}
          </h1>
          <p className="app-page-subtitle truncate">
            {isNew ? "Vertragsdaten erfassen" : contract?.customer_name}
          </p>
        </div>

        {/* Desktop: Action Buttons - Mobile: FAB */}
        {!isNew && contract && !isMobile && (
          <div className="order-3 lg:order-none basis-full lg:basis-auto flex items-center gap-2 md:gap-3 flex-wrap">
            {contract.status === CONTRACT_STATUS.ACTIVE && ['offen', 'geplant'].includes(contract.vvl_status) && (
              <Button
                onClick={() => setShowVvlWizard(true)}
                className="h-10 md:h-11 px-4 md:px-6 rounded-xl bg-emerald-500 text-white font-bold text-xs md:text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                VVL
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                try {
                  const customer = customers.find(c => c.id === contract?.customer_id);
                  if (!customer) {
                    toast.error('Kundendaten nicht gefunden');
                    return;
                  }
                  const blob = generateContractPDF({ customer, contract });
                  const url = createBlobURL(blob);
                  const filename = getContractFileName(customer, contract);
                  const success = downloadBlob(blob, filename);
                  if (success) toast.success('PDF geladen');
                  revokeBlobURL(url);
                } catch (e) {
                  console.error(e);
                  toast.error('Fehler beim PDF');
                }
              }}
              className="h-10 md:h-11 px-4 md:px-6 rounded-xl border-blue-500/30 text-blue-400 hover:bg-blue-500/10 font-semibold text-xs md:text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCancellationModal(true)}
              className="h-10 md:h-11 px-4 md:px-6 rounded-xl border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-semibold text-xs md:text-sm"
            >
              <FileX className="h-4 w-4 mr-2" />
              Kündigen
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('⚠️ Vertrag wirklich löschen?')) {
                  deleteContractMutation.mutate();
                }
              }}
              className="h-10 md:h-11 px-4 md:px-6 rounded-xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-semibold text-xs md:text-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </Button>
          </div>
        )}

        {/* Save Button - always visible on desktop, in FAB on mobile */}
        {!isMobile && (
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || createMutation.isPending || !formData.customer_id || !formData.provider_id || !formData.start_date}
            className="btn-premium bg-primary text-primary-foreground font-bold h-11 md:h-12 px-6 md:px-8 rounded-xl shadow-lg shadow-primary/20 text-sm order-3 sm:order-none"
          >
            <Save className="h-4 w-4 mr-2" />
            {isNew ? 'Erstellen' : 'Speichern'}
          </Button>
        )}
      </div>

      {/* Success Message nach Erstellen */}
      {!isNew && contract && justCreated && (
        <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-2 border-emerald-500/40">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-emerald-400 mb-1">Vertrag erfolgreich erstellt!</h3>
              <p className="text-sm text-emerald-300/80 mb-3">
                Sie können jetzt die unterschriebenen Vertragsdokumente hochladen (siehe unten).
              </p>
              <Button
                onClick={() => {
                  const uploadSection = document.querySelector('#contract-documents-section');
                  if (uploadSection) {
                    uploadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Highlight effect
                    uploadSection.classList.add('highlight-pulse');
                    setTimeout(() => uploadSection.classList.remove('highlight-pulse'), 2000);
                  }
                }}
                variant="outline"
                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Upload className="h-4 w-4 mr-2" />
                Zum Upload-Bereich
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Priority (nur bei bestehendem Vertrag) */}
      {!isNew && contract && priority && (
        <Card className="app-form-panel p-4">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-primary" />
            <Badge className={cn("font-bold", colors.text, "bg-transparent border-2", colors.border)}>
              {priority.label}
            </Badge>
            {priority.action && (
              <span className="text-sm text-muted-foreground">→ {priority.action}</span>
            )}
          </div>
        </Card>
      )}

      {/* Letzte VVL (nur bei bestehendem Vertrag mit VVL-Historie) */}
      {!isNew && contract && lastVvlRecord && (
        <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-2 border-emerald-500/30">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-400">Letzte VVL</h3>
                <p className="text-xs text-emerald-300/70">
                  {contract.last_vvl_date && format(new Date(contract.last_vvl_date), 'dd.MM.yyyy', { locale: de })}
                </p>
              </div>
            </div>
            <Badge className={cn(
              "text-xs border",
              lastVvlRecord.outcome === 'verlängert' ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                lastVvlRecord.outcome === 'follow_up' ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                  "bg-slate-500/15 text-slate-400 border-slate-500/30"
            )}>
              {{
                tarifwechsel: "Tarifwechsel",
                konditionsanpassung: "Konditionsanpassung",
                neuabschluss: "Neuabschluss",
                anbieterwechsel: "Anbieterwechsel"
              }[lastVvlRecord.vvl_type]}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Preis</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground font-semibold">
                  {lastVvlRecord.new_monthly_fee?.toFixed(2) || '0.00'}€
                </span>
                {lastVvlRecord.price_delta !== 0 && (
                  <Badge className={cn(
                    "text-xs",
                    lastVvlRecord.price_delta > 0 ? "bg-rose-500/15 text-rose-400" : "bg-emerald-500/15 text-emerald-400"
                  )}>
                    {lastVvlRecord.price_delta > 0 ? '+' : ''}{lastVvlRecord.price_delta?.toFixed(2)}€
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Provision</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-primary font-semibold">
                  {lastVvlRecord.new_commission?.toFixed(2) || '0.00'}€
                </span>
                {lastVvlRecord.commission_delta !== 0 && (
                  <Badge className={cn(
                    "text-xs",
                    lastVvlRecord.commission_delta > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                  )}>
                    {lastVvlRecord.commission_delta > 0 ? '+' : ''}{lastVvlRecord.commission_delta?.toFixed(2)}€
                  </Badge>
                )}
              </div>
            </div>

            {lastVvlRecord.one_time_bonus > 0 && (
              <div className="col-span-2 p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Einmalbonus</p>
                <span className="text-sm text-emerald-400 font-semibold">
                  +{lastVvlRecord.one_time_bonus?.toFixed(2)}€
                </span>
              </div>
            )}
          </div>

          {lastVvlRecord.new_tariff_name && (
            <p className="text-xs text-emerald-300/70 mt-3">
              Tarif: {lastVvlRecord.new_tariff_name}
            </p>
          )}
        </Card>
      )}

      <Card className="p-5 bg-card border border-border">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Aktivierungs-Checkliste</p>
        <div className="space-y-1">
          {contractChecklist.map(item => (
            <div key={item.key} className="text-sm flex items-center justify-between">
              <span>{item.label}</span>
              <span className={cn(item.complete ? "text-emerald-400" : "text-rose-400")}>{item.complete ? "Erfüllt" : "Fehlt"}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Vertragsdaten */}
      <Card className="p-5 bg-card border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-[#EAECEF]">Kunde *</Label>
            <Select value={formData.customer_id} onValueChange={(v) => handleFieldChange("customer_id", v)}>
              <SelectTrigger
                id="customer_id"
                className={cn("mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]", errors.customer_id && "border-red-500")}
              >
                <SelectValue placeholder="Kunde wählen..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id} className="text-[#EAECEF]">
                    {c.customer_type === "geschäftlich" ? c.company_name : `${c.first_name} ${c.last_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customer_id && <p className="text-xs text-red-500 mt-1">{errors.customer_id}</p>}
          </div>

          <div>
            <Label className="text-[#EAECEF]">Provider *</Label>
            <Select value={formData.provider_id} onValueChange={(v) => setFormData({ ...formData, provider_id: v })}>
              <SelectTrigger className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
                <SelectValue placeholder="Provider wählen..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                {providers.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-[#EAECEF]">{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[#EAECEF]">Kategorie *</Label>
            <Select value={formData.category} onValueChange={(v) => handleFieldChange("category", v)}>
              <SelectTrigger
                id="category"
                className={cn("mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]", errors.category && "border-red-500")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                <SelectItem value="mobilfunk" className="text-[#EAECEF]">Mobilfunk</SelectItem>
                <SelectItem value="festnetz_internet" className="text-[#EAECEF]">Festnetz / Internet</SelectItem>
                <SelectItem value="tv" className="text-[#EAECEF]">TV</SelectItem>
                <SelectItem value="kombi" className="text-[#EAECEF]">Kombi</SelectItem>
                <SelectItem value="sonstiges" className="text-[#EAECEF]">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>

          <div>
            <Label className="text-[#EAECEF]">Status</Label>
            <Select value={formData.status} onValueChange={(v) => handleFieldChange("status", v)}>
              <SelectTrigger className={cn("mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]", errors.status && "border-red-500")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                {CONTRACT_STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-[#EAECEF]">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status}</p>}
          </div>
        </div>
      </Card>

      {/* Laufzeit */}
      <Card className="app-form-panel p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-[#EAECEF]">Startdatum *</Label>
            <Input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={(e) => handleFieldChange("start_date", e.target.value)}
              className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
            />
          </div>

          <div>
            <Label className="text-[#EAECEF]">Laufzeit *</Label>
            <Select
              value={formData.contract_duration_months?.toString() || "24"}
              onValueChange={(v) => handleFieldChange("contract_duration_months", parseInt(v))}
            >
              <SelectTrigger
                id="contract_duration_months"
                className={cn("mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]", errors.contract_duration_months && "border-red-500")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                <SelectItem value="1" className="text-[#EAECEF]">1 Monat</SelectItem>
                <SelectItem value="12" className="text-[#EAECEF]">12 Monate</SelectItem>
                <SelectItem value="24" className="text-[#EAECEF]">24 Monate</SelectItem>
                <SelectItem value="36" className="text-[#EAECEF]">36 Monate</SelectItem>
              </SelectContent>
            </Select>
            {errors.contract_duration_months && <p className="text-xs text-red-500 mt-1">{errors.contract_duration_months}</p>}
          </div>

          <div>
            <Label className="text-[#EAECEF]">Kündigungsvorlauf</Label>
            <Select
              value={formData.notice_period_days?.toString() || DEFAULT_NOTICE_PERIOD_DAYS.toString()}
              onValueChange={(v) => setFormData({ ...formData, notice_period_days: parseInt(v) })}
            >
              <SelectTrigger className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                <SelectItem value="14" className="text-[#EAECEF]">14 Tage</SelectItem>
                <SelectItem value="30" className="text-[#EAECEF]">30 Tage</SelectItem>
                <SelectItem value="60" className="text-[#EAECEF]">60 Tage</SelectItem>
                <SelectItem value="90" className="text-[#EAECEF]">90 Tage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Auto-calculated preview */}
        {formData.start_date && calculatedData.end_date && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-blue-400" />
              <div className="flex-1 flex items-center gap-3">
                <div>
                  <span className="text-[#6B7280]">Ende: </span>
                  <span className="font-semibold text-[#EAECEF]">{format(new Date(calculatedData.end_date), 'dd.MM.yyyy')}</span>
                </div>
                <div>
                  <span className="text-[#6B7280]">Frist: </span>
                  <span className="font-semibold text-amber-400">{format(new Date(calculatedData.cancellation_deadline), 'dd.MM.yyyy')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {(!formData.start_date || !calculatedData.cancellation_deadline) && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <p className="text-sm text-amber-400">Kündigungsfrist fehlt – für VVL erforderlich</p>
          </div>
        )}
      </Card>

      {/* Tarif & kategoriespezifische Felder */}
      <ContractFormFields
        category={formData.category}
        formData={formData}
        errors={errors}
        onChange={(newData) => {
          setFormData(newData);
          if (errors.contract_number && newData.contract_number) {
            const { contract_number, ...rest } = errors;
            setErrors(rest);
          }
        }}
      />

      {/* Kosten */}
      <Card className="app-form-panel p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-[#EAECEF]">Monatliche Gebühr</Label>
            <div className="relative mt-2">
              <Input
                type="number"
                step="0.01"
                value={formData.monthly_fee}
                onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
                className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF] pr-8"
                placeholder="39.99"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]">€</span>
            </div>
          </div>

          <div>
            <Label className="text-[#EAECEF]">Ihre Provision</Label>
            <div className="relative mt-2">
              <Input
                type="number"
                step="0.01"
                value={formData.commission}
                onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF] pr-8"
                placeholder="50.00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">€</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Vertragsdokumente (Multi-Upload) */}
      {!isNew && contract && (
        <div id="contract-documents-section">
          <ContractDocuments
            contract={contract}
            onDocumentsUpdate={() => {
              queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
              queryClient.invalidateQueries({ queryKey: ['customerHistory', contract.customer_id] });
            }}
          />
        </div>
      )}

      {/* VVL Follow-up Bereich */}
      {!isNew && contract && ['in_bearbeitung', 'kunde_kontaktiert', 'angebot_erstellt'].includes(contract.vvl_status) && (
        <Card id="vvl-followup-section" className="p-5 bg-blue-500/10 border-2 border-blue-500/30">
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-[#EAECEF]">VVL läuft</h3>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {contract.vvl_status === 'in_bearbeitung' && 'In Bearbeitung'}
              {contract.vvl_status === 'kunde_kontaktiert' && 'Kunde kontaktiert'}
              {contract.vvl_status === 'angebot_erstellt' && 'Angebot erstellt'}
            </Badge>
          </div>

          {followups.filter(f => f.status === 'open').length > 0 ? (
            <div className="space-y-3">
              {followups.filter(f => f.status === 'open').map(followup => {
                const daysUntil = differenceInDays(new Date(followup.due_date), new Date());
                const isOverdue = daysUntil < 0;
                return (
                  <div key={followup.id} className="p-3 bg-[#181B21] border border-blue-500/30 rounded-lg">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-[#EAECEF] font-medium">{followup.note}</p>
                        <p className="text-xs text-[#6B7280] mt-1">
                          {isOverdue ? `${Math.abs(daysUntil)} Tage überfällig` : daysUntil === 0 ? 'Heute' : `In ${daysUntil} Tagen`}
                        </p>
                      </div>
                      <Select onValueChange={(value) => {
                        contractService.updateFollowup(followup.id, { status: 'done', vvl_action: value });
                        contractService.update(contractId, { vvl_status: value });
                        contractService.createActivity({
                          type: 'followup_completed',
                          customer_id: contract.customer_id,
                          customer_name: contract.customer_name,
                          contract_id: contractId,
                          short_text: `Follow-up: ${value}`
                        });
                        queryClient.invalidateQueries();
                      }}>
                        <SelectTrigger className="bg-[#1F2228] border-[#2D3139] text-[#EAECEF] w-48">
                          <SelectValue placeholder="Erledigt als..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                          <SelectItem value="kunde_kontaktiert" className="text-[#EAECEF]">Kunde kontaktiert</SelectItem>
                          <SelectItem value="angebot_erstellt" className="text-[#EAECEF]">Angebot erstellt</SelectItem>
                          <SelectItem value="verlängert" className="text-[#EAECEF]">Verlängert</SelectItem>
                          <SelectItem value="gekündigt" className="text-[#EAECEF]">Gekündigt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280]">Alle Follow-ups erledigt</p>
          )}
        </Card>
      )}

      {/* Notizen - IMMER anzeigen */}
      <Card className="app-form-panel p-5">
        <Label className="text-[#EAECEF]">Interne Notizen</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="mt-2 bg-[#1F2228] border-[#2D3139] text-[#EAECEF]"
          placeholder="Besonderheiten, Absprachen, Gesprächsnotizen..."
        />
        <p className="text-xs text-[#6B7280] mt-2">
          💡 Wird bei jeder Änderung historisiert
        </p>
      </Card>

      {/* Vertragsdokumente Upload - NEU */}
      {isNew && (
        <Card className="app-form-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#EAECEF]">Vertragsdokumente</h3>
              <p className="text-xs text-[#6B7280] mt-1">Unterschriebene Verträge jetzt hochladen</p>
            </div>
            <Badge className="bg-[#FFD24D]/20 text-[#FFD24D] border border-[#FFD24D]/30">
              {pendingDocuments.length} {pendingDocuments.length === 1 ? 'Dokument' : 'Dokumente'}
            </Badge>
          </div>

          <Label htmlFor="new-contract-doc-upload">
            <div className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer mb-4",
              uploadingContract
                ? "border-blue-500/50 bg-blue-500/5"
                : "border-[#2D3139] hover:border-[#FFD24D]/50 hover:bg-[#1F2228]/50"
            )}>
              {uploadingContract ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-blue-400">Wird hochgeladen...</span>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-[#FFD24D] mb-2" />
                  <p className="text-[#EAECEF] font-medium">Vertragsdokumente hochladen</p>
                  <p className="text-xs text-[#6B7280] mt-1">PDF, JPG oder PNG • Mehrere Dateien möglich</p>
                </>
              )}
            </div>
          </Label>
          <input
            id="new-contract-doc-upload"
            type="file"
            className="hidden"
            onChange={handleNewContractDocumentUpload}
            disabled={uploadingContract}
            accept=".pdf,.jpg,.jpeg,.png"
          />

          {pendingDocuments.length > 0 && (
            <div className="space-y-2">
              {pendingDocuments.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-[#1F2228] border border-[#2D3139] rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-[#FFD24D] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#EAECEF] font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-emerald-400">Wird beim Speichern hochgeladen</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemovePendingDocument(idx)}
                    className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Kundenaktivitäten Preview */}
      {!isNew && contract && customerHistory.length > 0 && (
        <Card className="app-form-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider">
              Letzte Kundenaktivitäten
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`${createPageUrl('CustomerDetail')}?id=${contract.customer_id}`)}
              className="border-[#2D3139] text-[#9CA3AF] hover:text-[#FFD24D] text-xs"
            >
              Alle anzeigen →
            </Button>
          </div>
          <HistoryPreview
            events={customerHistory}
            onAddClick={() => setShowQuickAddHistory(true)}
            limit={5}
          />
        </Card>
      )}

      {/* Quick Add History Modal */}
      {!isNew && contract && (
        <QuickAddModal
          open={showQuickAddHistory}
          onOpenChange={setShowQuickAddHistory}
          onSubmit={(data) => createHistoryMutation.mutate(data)}
          contracts={[contract]}
        />
      )}

      {/* VVL Wizard */}
      {!isNew && contract && (
        <VvlWizard
          open={showVvlWizard}
          onOpenChange={setShowVvlWizard}
          contract={contract}
          customer={customers.find(c => c.id === contract.customer_id)}
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            queryClient.invalidateQueries({ queryKey: ['followups', contractId] });
            queryClient.invalidateQueries({ queryKey: ['activities', contractId] });
            queryClient.invalidateQueries({ queryKey: ['customerHistory', contract.customer_id] });
          }}
        />
      )}

      {/* Cancellation Modal */}
      {!isNew && contract && (
        <CancellationModal
          open={showCancellationModal}
          onOpenChange={setShowCancellationModal}
          customer={customers.find(c => c.id === contract.customer_id)}
          contract={contract}
          provider={providers.find(p => p.id === contract.provider_id)}
          branch={branches.find(b => b.id === contract.branch_id)}
          onDocumentSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['customer', contract.customer_id] });
          }}
        />
      )}

      {/* Mobile: Multi-Action FAB */}
      {isMobile && (
        <FloatingActionButton
          actions={[
            {
              icon: Save,
              label: 'Speichern',
              onClick: handleSave
            },
            ...(!isNew && contract ? [
              {
                icon: Download,
                label: 'PDF',
                onClick: () => {
                  try {
                    const customer = customers.find(c => c.id === contract?.customer_id);
                    if (!customer) return;
                    const blob = generateContractPDF({ customer, contract });
                    const url = createBlobURL(blob);
                    const filename = getContractFileName(customer, contract);
                    downloadBlob(blob, filename);
                    revokeBlobURL(url);
                  } catch (e) {
                    console.error(e);
                  }
                }
              },
              {
                icon: FileX,
                label: 'Kündigen',
                onClick: () => setShowCancellationModal(true)
              },
              {
                icon: Trash2,
                label: 'Löschen',
                onClick: () => {
                  if (confirm('⚠️ Vertrag löschen?')) {
                    deleteContractMutation.mutate();
                  }
                }
              }
            ] : [])
          ]}
        />
      )}
    </motion.div>
  );
}
