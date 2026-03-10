import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useAllCustomersQuery,
  useBranchesQuery,
  useCustomerActivitiesQuery,
  useCustomerContractsQuery,
  useCustomerHistoryQuery,
  useCustomerQuery,
} from "@/features/customers/api/customers.hooks";
import {
  createCustomer,
  createCustomerHistory,
  deleteContract,
  deleteCustomer,
  updateCustomer,
  updateCustomerHistory,
  uploadCoreFile,
} from "@/features/customers/api/customers.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  FileText, Save, Upload, AlertTriangle, Euro, Trash2, Download, CheckSquare, Users, Briefcase, ArrowRight, CheckCircle2,
  Shield, Clock, Zap, CreditCard, IdCard, Sparkles, Info, Plus, MapPin, Loader2, X
} from "lucide-react";
import { differenceInDays } from "date-fns";
import { safeFormatDate, safeParseDate } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { generateDSGVOPDF } from "../components/pdf/dsgvoPdf";
import DSGVOPreviewModal from "../components/pdf/DSGVOPreviewModal";
import AddressAutocomplete from "../components/customers/AddressAutocomplete";
import { normalizeAddress } from "@/utils/addressNormalization";
import TimelineV2 from "../components/history/TimelineV2";
import QuickAddModal from "../components/history/QuickAddModal";
import { getAppointments, getOpenFollowups } from "@/components/utils/calendar";
import { logDocumentUploaded } from "@/components/utils/historyLogger";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { validateCustomerData } from "@/lib/validators";
import { motion } from "framer-motion";

const pageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function CustomerDetail({ isSplitView = false }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const urlParams = new URLSearchParams(window.location.search);
  const customerId = urlParams.get('id');
  const isNew = urlParams.get('new') === 'true';
  const urlStep = urlParams.get('step');

  const [customerType, setCustomerType] = useState("privat");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    contact_person_first_name: "",
    contact_person_last_name: "",
    email: "",
    phone: "",
    has_whatsapp: false,
    address: "",
    city: "",
    postal_code: "",
    birth_date: "",
    branch_id: "",
    notes: ""
  });
  const [errors, setErrors] = useState({});

  const [uploading, setUploading] = useState(false);
  const [creationStep, setCreationStep] = useState(0); // 0: Typ wählen, 1: Basisdaten, 2: DSGVO
  const [dsgvoSigned, setDsgvoSigned] = useState(false);
  const [dsgvoUploadedUrl, setDsgvoUploadedUrl] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [showNextSteps, setShowNextSteps] = useState(false);
  const [household, setHousehold] = useState([]);
  const [addressData, setAddressData] = useState({
    street: "",
    house_number: "",
    postal_code: "",
    city: ""
  });
  const [showAddHistoryModal, setShowAddHistoryModal] = useState(false);
  const [showDsgvoPreview, setShowDsgvoPreview] = useState(false);

  const { data: customer } = useCustomerQuery(customerId, !isNew);

  const { data: contracts = [] } = useCustomerContractsQuery(customerId, !isNew);

  const { data: branches = [] } = useBranchesQuery();

  const { data: allCustomers = [] } = useAllCustomersQuery(isNew);

  const { data: activities = [] } = useCustomerActivitiesQuery(customerId, !isNew);

  const { data: history = [] } = useCustomerHistoryQuery(customerId, !isNew);

  useEffect(() => {
    if (customer) {
      setCustomerType(customer.customer_type || "privat");
      setFormData({
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        company_name: customer.company_name || "",
        contact_person_first_name: customer.contact_person_first_name || "",
        contact_person_last_name: customer.contact_person_last_name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        has_whatsapp: customer.has_whatsapp || false,
        address: customer.address || "",
        city: customer.city || "",
        postal_code: customer.postal_code || "",
        birth_date: customer.birth_date || "",
        branch_id: customer.branch_id || "",
        notes: customer.notes || ""
      });

      if (customer.status === "draft" && (urlStep === "dsgvo" || !customer.dsgvo_document_url)) {
        setCreationStep(2);
      }

      if (customer.dsgvo_document_url) {
        setDsgvoUploadedUrl(customer.dsgvo_document_url);
        setDsgvoSigned(true);
      }

      // Parse address into structured format
      if (customer.address) {
        const match = customer.address.match(/^(.+?)\s+(\d+[a-zA-Z]?)$/);
        if (match) {
          setAddressData({
            street: match[1].trim(),
            house_number: match[2].trim(),
            postal_code: customer.postal_code || "",
            city: customer.city || ""
          });
        } else {
          setAddressData({
            street: customer.address || "",
            house_number: "",
            postal_code: customer.postal_code || "",
            city: customer.city || ""
          });
        }
      }
    }
  }, [customer, urlStep]);

  // Standard-Filiale setzen (erste verfügbare)
  useEffect(() => {
    if (isNew && branches.length > 0 && !formData.branch_id) {
      setFormData(prev => ({ ...prev, branch_id: branches[0].id }));
    }
  }, [branches, isNew]);

  const createDraftMutation = useMutation({
    mutationFn: (data) => {
      const branch = branches.find(b => b.id === data.branch_id);
      // Normalize address
      const normalizedAddress = `${addressData.street} ${addressData.house_number}`.trim();
      const addressNormalized = normalizeAddress(
        addressData.street,
        addressData.house_number,
        addressData.postal_code,
        addressData.city
      );
      return createCustomer({
        ...data,
        customer_type: customerType,
        branch_name: branch?.name || "",
        status: "draft",
        identity_documents: JSON.stringify([]),
        address: normalizedAddress,
        postal_code: addressData.postal_code,
        city: addressData.city,
        address_normalized: addressNormalized
      });
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      window.location.href = `${createPageUrl('CustomerDetail')}?id=${newCustomer.id}&step=dsgvo`;
    }
  });

  const completeDraftMutation = useMutation({
    mutationFn: () => {
      return updateCustomer(customerId, {
        dsgvo_document_url: dsgvoUploadedUrl || "",
        status: "complete"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowNextSteps(true);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const branch = branches.find(b => b.id === data.branch_id);
      // Normalize address
      const normalizedAddress = `${addressData.street} ${addressData.house_number}`.trim();
      const addressNormalized = normalizeAddress(
        addressData.street,
        addressData.house_number,
        addressData.postal_code,
        addressData.city
      );
      return updateCustomer(customerId, {
        ...data,
        branch_name: branch?.name || "",
        address: normalizedAddress,
        postal_code: addressData.postal_code,
        city: addressData.city,
        address_normalized: addressNormalized
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate(createPageUrl('Customers'));
    }
  });

  const deleteContractMutation = useMutation({
    mutationFn: (contractId) => deleteContract(contractId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', customerId] });
    }
  });

  const createHistoryMutation = useMutation({
    mutationFn: async (data) => {
      const customerName = customer?.customer_type === "geschäftlich"
        ? customer.company_name
        : `${customer.first_name} ${customer.last_name}`;

      return createCustomerHistory({
        customer_id: customerId,
        customer_name: customerName,
        type: data.type,
        title: data.title,
        notes: data.notes || "",
        channel: data.channel || "store",
        status: data.due_at ? "open" : "done",
        occurred_at: new Date().toISOString(),
        due_at: data.due_at || null,
        contract_id: data.contract_id || null,
        priority: data.priority || "medium",
        tags: "[]",
        is_system_event: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerHistory', customerId] });
    }
  });

  const markHistoryDoneMutation = useMutation({
    mutationFn: (historyId) => {
      return updateCustomerHistory(historyId, {
        status: "done"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerHistory', customerId] });
    }
  });

  // Household detection
  const handleHouseholdFound = (foundHousehold) => {
    setHousehold(foundHousehold);
  };

  // Duplikat-Prüfung
  useEffect(() => {
    if (!isNew || !formData.phone || !formData.address) {
      setDuplicateWarning(null);
      return;
    }

    const phoneDuplicates = allCustomers.filter(c =>
      c.phone === formData.phone
    );

    const addressDuplicates = allCustomers.filter(c =>
      (c.address || "").toLowerCase() === (formData.address || "").toLowerCase() &&
      c.postal_code === formData.postal_code
    );

    if (phoneDuplicates.length > 0) {
      setDuplicateWarning(`⚠️ Telefonnummer bereits vorhanden bei: ${phoneDuplicates.map(c =>
        c.customer_type === "geschäftlich" ? c.company_name : `${c.first_name} ${c.last_name}`
      ).join(', ')}`);
    } else if (addressDuplicates.length > 0) {
      setDuplicateWarning(`ℹ️ ${addressDuplicates.length} ${addressDuplicates.length === 1 ? 'Kunde' : 'Kunden'} an dieser Adresse: ${addressDuplicates.map(c =>
        c.customer_type === "geschäftlich" ? c.company_name : `${c.first_name} ${c.last_name}`
      ).join(', ')}`);
    } else {
      setDuplicateWarning(null);
    }
  }, [formData.phone, formData.address, formData.postal_code, allCustomers, isNew]);

  const focusFirstError = (errorMap) => {
    const order = [
      "first_name",
      "last_name",
      "company_name",
      "phone",
      "street",
      "postal_code",
      "city",
      "branch_id"
    ];
    const first = order.find((f) => errorMap[f]);
    if (first) {
      setTimeout(() => {
        const el =
          document.querySelector(`[name=\"${first}\"]`) ||
          document.getElementById(first);
        if (el && el.focus) el.focus();
      }, 0);
    }
  };

  const validateCustomerForm = () => {
    const newErrors = {};

    if (customerType === "privat") {
      if (!formData.first_name?.trim()) newErrors.first_name = "Vorname ist Pflicht";
      if (!formData.last_name?.trim()) newErrors.last_name = "Nachname ist Pflicht";
    } else {
      if (!formData.company_name?.trim()) newErrors.company_name = "Firmenname ist Pflicht";
    }

    if (!formData.phone?.trim()) newErrors.phone = "Telefonnummer ist Pflicht";
    if (!addressData.street?.trim()) newErrors.street = "Straße fehlt";
    if (!addressData.postal_code?.trim()) newErrors.postal_code = "PLZ fehlt";
    if (!addressData.city?.trim()) newErrors.city = "Stadt fehlt";
    if (!formData.branch_id) newErrors.branch_id = "Filiale auswählen";

    // Format-Validierung (E-Mail etc.)
    try {
      validateCustomerData({
        first_name: formData.first_name,
        last_name: formData.last_name,
        company_name: formData.company_name,
        email: formData.email,
        phone: formData.phone
      });
    } catch (err) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("email")) {
        newErrors.email = msg;
      }
    }

    return newErrors;
  };

  const handleSubmit = () => {
    if (creationStep === 2 && customerId) {
      completeDraftMutation.mutate();
      return;
    }

    const validationErrors = validateCustomerForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      focusFirstError(validationErrors);
      toast.error("Bitte Pflichtfelder prüfen");
      return;
    }
    setErrors({});

    if (isNew && creationStep === 1) {
      createDraftMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };



  const handleDsgvoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await uploadCoreFile(file);
      setDsgvoUploadedUrl(file_url);
      setDsgvoSigned(true);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await uploadCoreFile(file);

      const currentDocs = customer?.identity_documents
        ? JSON.parse(customer.identity_documents)
        : [];
      const newDocs = [...currentDocs, { url: file_url, name: file.name, date: new Date().toISOString() }];

      await updateCustomer(customerId, {
        identity_documents: JSON.stringify(newDocs)
      });

      await logDocumentUploaded(customerId, getCustomerDisplayName(), file.name);

      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  const identityDocs = customer?.identity_documents
    ? JSON.parse(customer.identity_documents)
    : [];

  const activeContracts = contracts.filter(c => c.status === 'aktiv');
  const totalMonthlyFees = activeContracts.reduce((sum, c) => sum + (c.monthly_fee || 0), 0);
  const totalCommission = contracts.reduce((sum, c) => sum + (c.commission || 0), 0);

  const today = new Date();
  const vvlContracts = activeContracts.filter(c => {
    if (!c.cancellation_deadline) return false;
    const deadline = safeParseDate(c.cancellation_deadline);
    if (!deadline) return false; // Safety check using safe parser
    const daysUntil = differenceInDays(deadline, today);
    return daysUntil >= 0 && daysUntil <= 90;
  });

  const statusColors = {
    aktiv: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    gekündigt: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    abgelaufen: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    verlängert: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    pausiert: "bg-amber-500/15 text-amber-400 border-amber-500/30"
  };

  const getCustomerDisplayName = () => {
    if (!customer) return "";
    if (customer.customer_type === "geschäftlich") {
      return customer.company_name || "Geschäftskunde";
    }
    return `${customer.first_name} ${customer.last_name}`;
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "w-full",
        isSplitView
          ? "max-w-none space-y-6 px-4 md:px-5 xl:px-6 py-4 md:py-5 pb-28"
          : "app-detail-shell lg:space-y-10"
      )}
    >
      {/* Next Steps Dialog */}
      {showNextSteps && (
        <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-2 border-emerald-500/50">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-emerald-400 mb-1">
                {dsgvoUploadedUrl ? "Kunde vollständig angelegt!" : "Kunde angelegt!"}
              </h3>
              {!dsgvoUploadedUrl && (
                <p className="text-xs text-amber-400 mb-3 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  DSGVO-Dokument kann später unter "Dokumente" nachgereicht werden
                </p>
              )}
              <p className="text-sm text-muted-foreground mb-4">
                Was möchten Sie als nächstes tun?
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => navigate(`${createPageUrl('ContractDetail')}?new=true&customer_id=${customerId}`)}
                  className="bg-gradient-to-r from-[#FFD24D] to-[#FFA500] text-[#0F1115] hover:from-[#E6BC3A] hover:to-[#E69500]"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Vertrag anlegen
                </Button>
                <Button
                  onClick={() => navigate(`${createPageUrl('CustomerDetail')}?id=${customerId}`)}
                  variant="outline"
                  className="border-[#2D3139] text-foreground"
                >
                  Kunde ansehen
                </Button>
                <Button
                  onClick={() => navigate(createPageUrl('Customers'))}
                  variant="outline"
                  className="border-[#2D3139] text-foreground"
                >
                  Zur Kundenliste
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className={cn("flex flex-wrap items-start", isSplitView ? "gap-3" : "gap-3 md:gap-4")}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(createPageUrl('Customers'))}
          className={cn("rounded-2xl bg-secondary/50 border border-transparent hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all", isSplitView ? "h-10 w-10 flex-shrink-0" : "h-12 w-12")}
        >
          {isSplitView ? <X className="h-5 w-5" /> : <ArrowLeft className="h-6 w-6 text-muted-foreground" />}
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className={cn("font-black tracking-tight text-gradient truncate", isSplitView ? "text-3xl" : "app-page-title")}>
            {isNew ? "Neuer Kunde" : getCustomerDisplayName()}
          </h1>
          {!isSplitView && (
            <p className="app-page-subtitle">
              {isNew ? "Kundendaten erfassen" : "Kundendetails und Verträge im Überblick"}
            </p>
          )}
        </div>

        {/* Desktop: Action Buttons - Mobile: FAB */}
        {!isNew && !isMobile && (
          <div className={cn("flex items-center gap-2 md:gap-3 flex-wrap", isSplitView ? "justify-end max-w-full ml-auto" : "md:justify-end")}>
            <Button
              onClick={() => {
                if (confirm('Kunde wirklich löschen? Alle zugehörigen Verträge bleiben erhalten.')) {
                  deleteMutation.mutate();
                }
              }}
              variant="outline"
              className={cn("rounded-xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-semibold", isSplitView ? "h-10 px-3 text-xs" : "h-12 px-6")}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </Button>
            <Button
              onClick={() => navigate(`${createPageUrl('ContractDetail')}?new=true&customer_id=${customerId}`)}
              variant="outline"
              className={cn("rounded-xl border-primary/30 text-primary hover:bg-primary/10 font-semibold", isSplitView ? "h-10 px-3 text-xs" : "h-12 px-6")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Vertrag
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              className={cn("btn-premium bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20", isSplitView ? "h-10 px-4 text-xs" : "h-12 px-8")}
            >
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </div>
        )}
      </div>

      {/* Stats (nur bei bestehendem Kunden) */}
      {!isNew && customer && (
        <div className={cn("grid gap-3", isSplitView ? "grid-cols-2 2xl:grid-cols-5" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-5")}>
          <button
            onClick={() => {
              const contractsTab = document.querySelector('[value="contracts"]');
              if (contractsTab) contractsTab.click();
            }}
            className={cn("text-left glass-card card-premium border-transparent rounded-xl hover:border-[#FFD24D]/30 transition-all", isSplitView ? "p-4" : "p-5")}
          >
            <p className="text-xs text-muted-foreground mb-1">Aktive Verträge</p>
            <p className={cn("font-bold text-foreground", isSplitView ? "text-2xl" : "text-3xl")}>{activeContracts.length}</p>
          </button>
          <div className={cn("glass-card card-premium border-transparent rounded-xl", isSplitView ? "p-4" : "p-5")}>
            <p className="text-xs text-muted-foreground mb-1">Monatliche Gebühren</p>
            <p className={cn("font-bold text-foreground", isSplitView ? "text-2xl" : "text-3xl")}>{totalMonthlyFees.toFixed(2)} €</p>
          </div>
          <div className={cn("glass-card card-premium border-transparent rounded-xl", isSplitView ? "p-4" : "p-5")}>
            <p className="text-xs text-muted-foreground mb-1">Gesamtprovision</p>
            <p className={cn("font-bold text-[#FFD24D]", isSplitView ? "text-2xl" : "text-3xl")}>{totalCommission.toFixed(2)} €</p>
          </div>
          <button
            onClick={() => {
              const historyTab = document.querySelector('[value="history"]');
              if (historyTab) historyTab.click();
            }}
            className={cn("text-left bg-amber-500/10 border border-amber-500/30 rounded-xl hover:border-amber-500/50 transition-all", isSplitView ? "p-4" : "p-5")}
          >
            <p className="text-xs text-amber-400 mb-1">Offene Follow-ups</p>
            <p className={cn("font-bold text-amber-400", isSplitView ? "text-2xl" : "text-3xl")}>{getOpenFollowups(history).length}</p>
          </button>
          <button
            onClick={() => {
              const historyTab = document.querySelector('[value="history"]');
              if (historyTab) historyTab.click();
            }}
            className={cn("text-left bg-indigo-500/10 border border-indigo-500/30 rounded-xl hover:border-indigo-500/50 transition-all", isSplitView ? "p-4" : "p-5")}
          >
            <p className="text-xs text-indigo-400 mb-1">Termine</p>
            <p className={cn("font-bold text-indigo-400", isSplitView ? "text-2xl" : "text-3xl")}>{getAppointments(history).length}</p>
          </button>
        </div>
      )}

      {/* NEW CENTERED CREATION FLOW */}
      {
        (isNew || (customer?.status === "draft" && creationStep > 0)) ?
          <div className="max-w-2xl mx-auto w-full">

            {/* Progress Header */}
            <div className="mb-8 text-center space-y-2">
              <h2 className="text-3xl font-black tracking-tight text-gradient">
                {creationStep === 0 ? "Kunde anlegen" : creationStep === 1 ? "Daten erfassen" : "Abschluss"}
              </h2>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span className={cn("px-2 py-0.5 rounded-full transition-colors", creationStep >= 0 ? "bg-[#FFD24D]/20 text-[#FFD24D]" : "bg-transparent")}>1. Typ</span>
                <span className="text-muted-foreground/30">→</span>
                <span className={cn("px-2 py-0.5 rounded-full transition-colors", creationStep >= 1 ? "bg-[#FFD24D]/20 text-[#FFD24D]" : "bg-transparent")}>2. Daten</span>
                <span className="text-muted-foreground/30">→</span>
                <span className={cn("px-2 py-0.5 rounded-full transition-colors", creationStep >= 2 ? "bg-[#FFD24D]/20 text-[#FFD24D]" : "bg-transparent")}>3. DSGVO</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Schritt 0: Kundentyp wählen */}
              {creationStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setCustomerType("privat");
                      setCreationStep(1);
                    }}
                    className="group relative p-6 h-full rounded-2xl border border-[#2D3139] bg-[#181B21] hover:border-[#FFD24D]/50 hover:bg-[#181B21]/80 transition-all text-left overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFD24D]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="h-12 w-12 rounded-xl bg-[#1F2228] border border-[#2D3139] flex items-center justify-center mb-4 group-hover:border-[#FFD24D]/50 transition-colors">
                        <Users className="h-6 w-6 text-[#FFD24D]" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground mb-1">Privatkunde</h4>
                      <p className="text-sm text-muted-foreground">Für Einzelpersonen und Haushalte.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setCustomerType("geschäftlich");
                      setCreationStep(1);
                    }}
                    className="group relative p-6 h-full rounded-2xl border border-[#2D3139] bg-[#181B21] hover:border-blue-500/50 hover:bg-[#181B21]/80 transition-all text-left overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="h-12 w-12 rounded-xl bg-[#1F2228] border border-[#2D3139] flex items-center justify-center mb-4 group-hover:border-blue-500/50 transition-colors">
                        <Briefcase className="h-6 w-6 text-blue-400" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground mb-1">Geschäftskunde</h4>
                      <p className="text-sm text-muted-foreground">Für Firmen und Gewerbe.</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Schritt 1: Basisdaten für DSGVO */}
              {creationStep === 1 && (
                <Card className="p-6 md:p-8 bg-[#181B21] border-[#2D3139]">
                  <div className="space-y-8">

                    {/* Section: Who */}
                    <div className="space-y-4">
                      <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        {customerType === "privat" ? <Users className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                        {customerType === "privat" ? "Wer ist der Kunde?" : "Firmendetails"}
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customerType === "privat" ? (
                          <>
                            <div className="space-y-1.5">
                              <Label>Vorname <span className="text-[#FFD24D]">*</span></Label>
                              <Input
                                name="first_name"
                                value={formData.first_name}
                                onChange={(e) => {
                                  setFormData({ ...formData, first_name: e.target.value });
                                  if (errors.first_name) {
                                    const { first_name, ...rest } = errors;
                                    setErrors(rest);
                                  }
                                }}
                                className={cn("bg-[#1F2228]", errors.first_name && "border-red-500")}
                              />
                              {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
                            </div>
                            <div className="space-y-1.5">
                              <Label>Nachname <span className="text-[#FFD24D]">*</span></Label>
                              <Input
                                name="last_name"
                                value={formData.last_name}
                                onChange={(e) => {
                                  setFormData({ ...formData, last_name: e.target.value });
                                  if (errors.last_name) {
                                    const { last_name, ...rest } = errors;
                                    setErrors(rest);
                                  }
                                }}
                                className={cn("bg-[#1F2228]", errors.last_name && "border-red-500")}
                              />
                              {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
                            </div>
                          </>
                        ) : (
                          <div className="col-span-2 space-y-1.5">
                            <Label>Firmenname <span className="text-[#FFD24D]">*</span></Label>
                            <Input
                              name="company_name"
                              value={formData.company_name}
                              onChange={(e) => {
                                setFormData({ ...formData, company_name: e.target.value });
                                if (errors.company_name) {
                                  const { company_name, ...rest } = errors;
                                  setErrors(rest);
                                }
                              }}
                              className={cn("bg-[#1F2228]", errors.company_name && "border-red-500")}
                            />
                            {errors.company_name && <p className="text-xs text-red-500 mt-1">{errors.company_name}</p>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section: Contact */}
                    <div className="space-y-4 pt-6 border-t border-[#2D3139]">
                      <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Zap className="h-4 w-4" /> Kontakt
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Telefon <span className="text-[#FFD24D]">*</span></Label>
                          <Input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\s/g, '');
                              if (value.startsWith('0') && value.length > 4) value = value.slice(0, 4) + ' ' + value.slice(4);
                              setFormData({ ...formData, phone: value });
                              if (errors.phone) {
                                const { phone, ...rest } = errors;
                                setErrors(rest);
                              }
                            }}
                            className={cn("bg-[#1F2228]", errors.phone && "border-red-500")}
                            placeholder="0176..."
                          />
                          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label>E-Mail</Label>
                          <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className={cn("bg-[#1F2228]", errors.email && "border-red-500")}
                          />
                          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Section: Address */}
                    <div className="space-y-4 pt-6 border-t border-[#2D3139]">
                      <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Adresse
                      </h5>

                      <div className="space-y-4">
                        <AddressAutocomplete
                          customers={allCustomers}
                          value={addressData}
                          onChange={(newData) => {
                            setAddressData(newData);
                            const newErrors = { ...errors };
                            if (newData.street) delete newErrors.street;
                            if (newData.postal_code) delete newErrors.postal_code;
                            if (newData.city) delete newErrors.city;
                            setErrors(newErrors);
                          }}
                          onHouseholdFound={handleHouseholdFound}
                          errors={errors}
                        />

                        {/* Filiale */}
                        <div className="space-y-1.5">
                          <Label>Filiale <span className="text-[#FFD24D]">*</span></Label>
                          {branches.length === 0 ? (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-400 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Keine Filialen gefunden (Systemfehler)</span>
                            </div>
                          ) : (
                            <Select
                              value={formData.branch_id}
                              onValueChange={(v) => setFormData({ ...formData, branch_id: v })}
                            >
                              <SelectTrigger
                                id="branch_id"
                                className={cn("w-full bg-[#1F2228]", errors.branch_id && "border-red-500")}
                              >
                                <SelectValue placeholder="Filiale wählen..." />
                              </SelectTrigger>
                              <SelectContent className="bg-[#181B21] border-[#2D3139]">
                                {branches.map(b => (
                                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {errors.branch_id && <p className="text-xs text-red-500 mt-1">{errors.branch_id}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#2D3139]">
                    <Button variant="ghost" onClick={() => setCreationStep(0)} className="text-muted-foreground hover:text-foreground">
                      Zurück
                    </Button>
                    <Button onClick={handleSubmit} className="btn-premium px-8">
                      Weiter
                    </Button>
                  </div>

                </Card>
              )}

              {/* Schritt 2: DSGVO */}
              {creationStep === 2 && (
                <Card className="app-form-panel p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Schritt 2: Rechtssichere Einwilligung
                    </h3>
                    <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      2 von 2
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Kunde ist angelegt – jetzt noch DSGVO-Dokument unterschreiben lassen
                  </p>

                  <div className="space-y-6">
                    {/* Prozess-Flow */}
                    <div className="flex items-center gap-3 p-4 bg-[#1F2228] rounded-lg border border-[#2D3139]">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="h-8 w-8 rounded-full bg-[#FFD24D] text-[#0F1115] flex items-center justify-center font-bold text-sm">1</div>
                          <span className="text-foreground">PDF erzeugen</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-2 text-sm">
                          <div className="h-8 w-8 rounded-full bg-[#FFD24D] text-[#0F1115] flex items-center justify-center font-bold text-sm">2</div>
                          <span className="text-foreground">Unterschreiben</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-2 text-sm">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm",
                            dsgvoSigned ? "bg-emerald-500 text-white" : "bg-[#2D3139] text-muted-foreground"
                          )}>3</div>
                          <span className={dsgvoSigned ? "text-emerald-400" : "text-muted-foreground"}>Hochladen</span>
                        </div>
                      </div>
                    </div>

                    {/* Schritt 1: PDF generieren */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-[#FFD24D]/20 text-[#FFD24D] flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">1</div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-foreground mb-2">DSGVO-Dokument generieren</h4>
                          <Button
                            onClick={() => setShowDsgvoPreview(true)}
                            variant="outline"
                            className="border-primary text-primary hover:bg-primary/10"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            PDF Vorschau & Download
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            Enthält bereits alle Kundendaten – nur noch ausdrucken
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Schritt 2: Hochladen */}
                    <div className="space-y-3 pt-4 border-t border-[#2D3139]">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5",
                          dsgvoSigned ? "bg-emerald-500 text-white" : "bg-[#2D3139] text-muted-foreground"
                        )}>2</div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-foreground mb-2">Unterschriebenes Dokument hochladen</h4>
                          <Label htmlFor="dsgvo-upload" className="cursor-pointer block">
                            <div className={cn(
                              "border-2 border-dashed rounded-xl p-8 text-center transition-all group",
                              dsgvoSigned
                                ? "border-emerald-500/50 bg-emerald-500/10"
                                : "border-[#2D3139] hover:border-[#FFD24D]/50 hover:bg-[#1F2228]"
                            )}>
                              {dsgvoSigned ? (
                                <div className="space-y-3">
                                  <div className="h-14 w-14 mx-auto rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                    <CheckSquare className="h-7 w-7 text-emerald-400" />
                                  </div>
                                  <div>
                                    <p className="text-emerald-400 font-semibold text-base mb-1">Dokument gespeichert ✓</p>
                                    <p className="text-sm text-emerald-400/70">DSGVO-Einwilligung liegt vor</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="h-14 w-14 mx-auto rounded-2xl bg-[#FFD24D]/10 flex items-center justify-center group-hover:bg-[#FFD24D]/20 transition-all">
                                    <Upload className="h-7 w-7 text-[#FFD24D]  transition-transform" />
                                  </div>
                                  <div>
                                    <p className="text-foreground font-semibold text-base mb-1">Klicken zum Hochladen</p>
                                    <p className="text-sm text-muted-foreground">PDF, JPG oder PNG</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Label>
                          <input
                            id="dsgvo-upload"
                            type="file"
                            className="hidden"
                            onChange={handleDsgvoUpload}
                            disabled={uploading}
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                          {!dsgvoSigned && (
                            <p className="text-xs text-muted-foreground mt-2">
                              💡 Kann auch später nachgereicht werden – Kunde ist bereits angelegt
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-[#2D3139]">
                      {dsgvoSigned ? (
                        <div className="flex justify-between items-center">
                          <Button
                            onClick={() => {
                              setCreationStep(1);
                              setDsgvoSigned(false);
                              setDsgvoUploadedUrl("");
                            }}
                            variant="outline"
                            className="border-[#2D3139] text-muted-foreground"
                          >
                            ← Zurück zu Daten
                          </Button>
                          <Button
                            onClick={handleSubmit}
                            disabled={completeDraftMutation.isPending}
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                          >
                            {completeDraftMutation.isPending ? (
                              <>
                                <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Wird gespeichert...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Kunde abschließen
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 text-sm">
                              <p className="text-blue-400 font-medium mb-1">DSGVO-Dokument kann nachgereicht werden</p>
                              <p className="text-blue-300/80">
                                Sie können den Kunden jetzt abschließen und das Dokument später hochladen.
                                Der Kunde ist dann sofort verfügbar und Sie können Verträge anlegen.
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <Button
                              onClick={() => {
                                setCreationStep(1);
                                setDsgvoSigned(false);
                                setDsgvoUploadedUrl("");
                              }}
                              variant="outline"
                              className="border-[#2D3139] text-muted-foreground"
                            >
                              ← Zurück zu Daten
                            </Button>
                            <Button
                              onClick={handleSubmit}
                              disabled={completeDraftMutation.isPending}
                              className="bg-gradient-to-r from-[#FFD24D] to-[#FFA500] text-[#0F1115] hover:from-[#E6BC3A] hover:to-[#E69500]"
                            >
                              {completeDraftMutation.isPending ? (
                                <>
                                  <div className="h-4 w-4 mr-2 border-2 border-[#0F1115] border-t-transparent rounded-full animate-spin" />
                                  Wird gespeichert...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Kunde anlegen & später vervollständigen
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Mobile: FAB mit Multi-Actions */}
              {!isNew && isMobile && (
                <FloatingActionButton
                  actions={[
                    {
                      icon: Save,
                      label: 'Speichern',
                      onClick: handleSubmit
                    },
                    {
                      icon: Plus,
                      label: 'Neuer Vertrag',
                      onClick: () => navigate(`${createPageUrl('ContractDetail')}?new=true&customer_id=${customerId}`)
                    },
                    {
                      icon: Trash2,
                      label: 'Kunde löschen',
                      onClick: () => {
                        if (confirm('Kunde wirklich löschen? Alle zugehörigen Verträge bleiben erhalten.')) {
                          deleteMutation.mutate();
                        }
                      }
                    }
                  ]}
                />
              )}
            </div>
          </div>
          :
          <Tabs defaultValue="info" className="space-y-4 md:space-y-6">
            <div
              className={cn(
                "glass-card card-premium border-transparent rounded-2xl p-1 overflow-x-auto",
                "sticky z-20 bg-background/85 backdrop-blur-xl shadow-lg shadow-black/10",
                isSplitView ? "top-[58px]" : "top-0"
              )}
            >
              <TabsList className="bg-transparent border-none h-auto p-0 inline-flex min-w-max gap-1">
                <TabsTrigger value="info" className="data-[state=active]:bg-[#FFD24D] data-[state=active]:text-[#0F1115] rounded-xl px-3 py-2 whitespace-nowrap">
                  Kundendaten
                </TabsTrigger>
                <TabsTrigger value="contracts" className="data-[state=active]:bg-[#FFD24D] data-[state=active]:text-[#0F1115] rounded-xl px-3 py-2 whitespace-nowrap">
                  Verträge ({contracts.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-[#FFD24D] data-[state=active]:text-[#0F1115] rounded-xl px-3 py-2 whitespace-nowrap">
                  Historie ({history.length})
                </TabsTrigger>
                <TabsTrigger value="documents" className="data-[state=active]:bg-[#FFD24D] data-[state=active]:text-[#0F1115] rounded-xl px-3 py-2 whitespace-nowrap">
                  Dokumente ({identityDocs.length + (customer?.dsgvo_document_url ? 1 : 0)})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="info">
              <div className="space-y-6">
                <Card className="app-form-panel p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {customer?.customer_type === "privat" ? (
                      <>
                        <div>
                          <Label className="text-foreground">Vorname</Label>
                          <Input
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            className="mt-2 bg-secondary/50 border-border focus:bg-background focus:border-primary/50"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground">Nachname</Label>
                          <Input
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            className="mt-2 bg-secondary/50 border-border focus:bg-background focus:border-primary/50"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground">Geburtsdatum</Label>
                          <Input
                            type="date"
                            value={formData.birth_date}
                            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                            className="mt-2 bg-secondary/50 border-border focus:bg-background focus:border-primary/50"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="md:col-span-2">
                          <Label className="text-foreground">Firmenname</Label>
                          <Input
                            value={formData.company_name}
                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                            className="mt-2 bg-secondary/50 border-border focus:bg-background focus:border-primary/50"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground">Ansprechpartner Vorname</Label>
                          <Input
                            value={formData.contact_person_first_name}
                            onChange={(e) => setFormData({ ...formData, contact_person_first_name: e.target.value })}
                            className="mt-2 bg-secondary/50 border-border focus:bg-background focus:border-primary/50"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground">Ansprechpartner Nachname</Label>
                          <Input
                            value={formData.contact_person_last_name}
                            onChange={(e) => setFormData({ ...formData, contact_person_last_name: e.target.value })}
                            className="mt-2 bg-secondary/50 border-border focus:bg-background focus:border-primary/50"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <Label className="text-foreground">Telefon</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-2 bg-secondary/50 border-border focus:bg-background focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground">E-Mail</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-2 bg-secondary/50 border-border focus:bg-background focus:border-primary/50"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground">WhatsApp verfügbar</Label>
                      <Switch
                        checked={formData.has_whatsapp}
                        onCheckedChange={(checked) => setFormData({ ...formData, has_whatsapp: checked })}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-foreground">Adresse</Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="mt-2 bg-secondary/50 border-border focus:bg-background focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground">PLZ</Label>
                      <Input
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        className="mt-2 bg-secondary/50 border-border focus:bg-background focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground">Stadt</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="mt-2 bg-secondary/50 border-border focus:bg-background focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground">Filiale</Label>
                      <Select value={formData.branch_id} onValueChange={(v) => setFormData({ ...formData, branch_id: v })}>
                        <SelectTrigger className="mt-2 bg-secondary/50 border-border focus:bg-background focus:border-primary/50">
                          <SelectValue placeholder="Filiale wählen..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1F2228] border-[#2D3139]">
                          {branches.map(b => (
                            <SelectItem key={b.id} value={b.id} className="text-foreground">{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-foreground">Notizen</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={4}
                        className="mt-2 bg-secondary/50 border-border focus:bg-background focus:border-primary/50"
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="contracts">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    onClick={() => navigate(`${createPageUrl('ContractDetail')}?new=true&customer_id=${customerId}`)}
                    className="bg-gradient-to-r from-[#FFD24D] to-[#FFA500] text-[#0F1115] hover:from-[#E6BC3A] hover:to-[#E69500]"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Neuer Vertrag
                  </Button>
                </div>

                {vvlContracts.length > 0 && (
                  <Card className="p-5 bg-rose-500/10 border-rose-500/30">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-rose-400" />
                      <h3 className="font-semibold text-rose-400">
                        VVL-Verträge ({vvlContracts.length})
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {vvlContracts.map(contract => {
                        const deadline = safeParseDate(contract.cancellation_deadline);
                        const daysUntil = deadline ? differenceInDays(deadline, today) : 0;
                        return (
                          <Card
                            key={contract.id}
                            onClick={() => navigate(`${createPageUrl('ContractDetail')}?id=${contract.id}`)}
                            className="p-4 bg-[#1F2228] border-rose-500/50 hover:border-rose-400 cursor-pointer transition-all"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-foreground">{contract.provider_name}</p>
                                <p className="text-sm text-muted-foreground">{contract.category}</p>
                                <Badge className="mt-2 bg-rose-500/15 text-rose-400 border-rose-500/30">
                                  {daysUntil} Tage bis Kündigungsfrist
                                </Badge>
                              </div>
                              <p className="text-lg font-semibold text-[#FFD24D]">
                                {contract.monthly_fee?.toFixed(2)} €
                              </p>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </Card>
                )}

                <div className="grid gap-3">
                  {contracts.map(contract => (
                    <Card
                      key={contract.id}
                      className="app-form-panel p-5 hover:border-[#FFD24D]/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => navigate(`${createPageUrl('ContractDetail')}?id=${contract.id}`)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-foreground">{contract.provider_name}</h4>
                            <Badge className={cn("text-xs border", statusColors[contract.status])}>
                              {contract.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="text-[#FFD24D]">{contract.category}</span>
                            {contract.contract_number && (
                              <>
                                <span>•</span>
                                <span>Nr. {contract.contract_number}</span>
                              </>
                            )}
                            {contract.start_date && (
                              <>
                                <span>•</span>
                                <span>{safeFormatDate(contract.start_date, 'dd.MM.yyyy')}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {contract.monthly_fee?.toFixed(2)} €<span className="text-xs">/Monat</span>
                            </p>
                            {contract.commission > 0 && (
                              <p className="text-sm font-semibold text-[#FFD24D] flex items-center gap-1 justify-end">
                                <Euro className="h-3 w-3" />
                                {contract.commission.toFixed(2)} €
                              </p>
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Vertrag wirklich löschen?')) {
                                deleteContractMutation.mutate(contract.id);
                              }
                            }}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {contracts.length === 0 && (
                  <Card className="p-12 text-center bg-[#181B21] border-[#2D3139]">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">Keine Verträge</h3>
                    <p className="text-muted-foreground">Dieser Kunde hat noch keine Verträge.</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-4">
                {/* Header with Add Button */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Kundenhistorie & Follow-ups</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Alle Kontakte, Services und Ereignisse + offene Aufgaben
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowAddHistoryModal(true)}
                    className="bg-gradient-to-r from-[#FFD24D] to-[#FFA500] text-[#0F1115] hover:from-[#E6BC3A] hover:to-[#E69500]"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Schnelleintrag
                  </Button>
                </div>

                {/* Timeline */}
                <Card className="app-form-panel p-6">
                  <TimelineV2
                    events={history}
                    onEventClick={(event) => {
                      if (event.contract_id) {
                        navigate(`${createPageUrl('ContractDetail')}?id=${event.contract_id}`);
                      }
                    }}
                    onMarkDone={(id) => markHistoryDoneMutation.mutate(id)}
                    showFilters={true}
                  />
                </Card>

                {/* Quick Add Modal */}
                <QuickAddModal
                  open={showAddHistoryModal}
                  onOpenChange={setShowAddHistoryModal}
                  onSubmit={(data) => createHistoryMutation.mutate(data)}
                  contracts={contracts}
                />
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <div className="space-y-6">
                {/* Compliance-Status Header */}
                <Card className={cn(
                  "p-6 border-2",
                  customer?.dsgvo_document_url
                    ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/40"
                    : "bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/40"
                )}>
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                      customer?.dsgvo_document_url ? "bg-emerald-500" : "bg-amber-500"
                    )}>
                      <Shield className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className={cn(
                          "text-xl font-bold",
                          customer?.dsgvo_document_url ? "text-emerald-400" : "text-amber-400"
                        )}>
                          {customer?.dsgvo_document_url
                            ? "Rechtssicherheit vollständig"
                            : "DSGVO-Einwilligung ausstehend"
                          }
                        </h2>
                        {customer?.dsgvo_document_url && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Bereit für Verträge
                          </Badge>
                        )}
                      </div>
                      <p className={cn(
                        "text-sm leading-relaxed",
                        customer?.dsgvo_document_url ? "text-emerald-300/80" : "text-amber-300/80"
                      )}>
                        {customer?.dsgvo_document_url
                          ? "Datenschutz erledigt, Kunde rechtlich sauber angelegt. Verträge können ohne Einschränkung abgeschlossen werden."
                          : "Die DSGVO-Einwilligung fehlt noch. Bitte laden Sie das unterschriebene Dokument hoch, um den Kunden vollständig abzusichern."
                        }
                      </p>
                    </div>
                  </div>

                  {/* Quick Status */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#2D3139]">
                    <div className="flex items-center gap-2 text-sm">
                      {customer?.dsgvo_document_url ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-400" />
                      )}
                      <span className="text-muted-foreground">DSGVO</span>
                      <span className={customer?.dsgvo_document_url ? "text-emerald-400" : "text-amber-400"}>
                        {customer?.dsgvo_document_url ? "Erledigt" : "Offen"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {identityDocs.some(d => (d.name || "").toLowerCase().includes('ausweis') || (d.name || "").toLowerCase().includes('id')) ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Info className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-muted-foreground">Ausweis</span>
                      <span className={identityDocs.some(d => (d.name || "").toLowerCase().includes('ausweis') || (d.name || "").toLowerCase().includes('id')) ? "text-emerald-400" : "text-muted-foreground"}>
                        {identityDocs.some(d => (d.name || "").toLowerCase().includes('ausweis') || (d.name || "").toLowerCase().includes('id')) ? "Hinterlegt" : "Optional"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {identityDocs.some(d => (d.name || "").toLowerCase().includes('iban') || (d.name || "").toLowerCase().includes('bank')) ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Info className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-muted-foreground">IBAN</span>
                      <span className={identityDocs.some(d => (d.name || "").toLowerCase().includes('iban') || (d.name || "").toLowerCase().includes('bank')) ? "text-emerald-400" : "text-muted-foreground"}>
                        {identityDocs.some(d => (d.name || "").toLowerCase().includes('iban') || (d.name || "").toLowerCase().includes('bank')) ? "Hinterlegt" : "Optional"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-[#FFD24D]" />
                      <span className="text-muted-foreground">Gesamt</span>
                      <span className="text-foreground">{identityDocs.length + (customer?.dsgvo_document_url ? 1 : 0)} Dokumente</span>
                    </div>
                  </div>
                </Card>

                {/* DSGVO Dokument - als abgeschlossener Meilenstein */}
                <Card className="app-form-panel p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center",
                      customer?.dsgvo_document_url ? "bg-emerald-500/20" : "bg-amber-500/20"
                    )}>
                      <Shield className={cn(
                        "h-5 w-5",
                        customer?.dsgvo_document_url ? "text-emerald-400" : "text-amber-400"
                      )} />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">Datenschutz-Einwilligung</h4>
                      <p className="text-xs text-muted-foreground">Pflichtdokument für rechtssichere Kundenbeziehung</p>
                    </div>
                  </div>

                  {customer?.dsgvo_document_url ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                        <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-emerald-400">Meilenstein erreicht</p>
                          <p className="text-sm text-emerald-300/80">
                            Kunde datenschutzrechtlich abgesichert – bereit für alle Vertragsarten
                          </p>
                        </div>
                        <Button
                          onClick={() => window.open(customer.dsgvo_document_url, '_blank')}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                          Dokument ansehen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-amber-400 mb-1">DSGVO-Einwilligung noch nicht hinterlegt</p>
                          <p className="text-sm text-amber-300/80">
                            Laden Sie das unterschriebene Dokument hoch, um den Kunden vollständig abzusichern.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={async () => {
                            const selectedBranch = branches?.find(b => b.id === formData.branch_id);
                            // Simple heuristic: If branch has city, use it; otherwise fallback to Name or Bielefeld.
                            // Assuming branch object might have 'city' property.
                            const signingCity = selectedBranch?.city || selectedBranch?.name || "Bielefeld";

                            const result = generateDSGVOPDF({
                              formData,
                              customerType: customer.customer_type,
                              addressData,
                              signingCity
                            });
                            if (result && result.blob) {
                              setUploading(true);
                              try {
                                const file = new File([result.blob], result.fileName, { type: "application/pdf" });
                                const { file_url } = await uploadCoreFile(file);
                                await updateCustomer(customerId, { dsgvo_document_url: file_url });
                                await logDocumentUploaded(customerId, getCustomerDisplayName(), "DSGVO-Einwilligung (Automatisch generiert)");
                                queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
                                toast.success("DSGVO-Dokument wurde automatisch im CRM gespeichert");
                              } catch (error) {
                                console.error('Auto-upload failed:', error);
                                toast.error("PDF generiert, aber Upload fehlgeschlagen. Bitte manuell hochladen.");
                              }
                              setUploading(false);
                            }
                          }}
                          variant="outline"
                          className="border-[#FFD24D] text-[#FFD24D] hover:bg-[#FFD24D]/10"
                          disabled={uploading}
                        >
                          {uploading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          PDF generieren + Speichern
                        </Button>
                        <Label htmlFor="dsgvo-upload-late" className="cursor-pointer">
                          <Button asChild className="bg-[#FFD24D] text-[#0F1115] hover:bg-[#E6BC3A]">
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Unterschriebenes Dokument hochladen
                            </span>
                          </Button>
                        </Label>
                        <input
                          id="dsgvo-upload-late"
                          type="file"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploading(true);
                            try {
                              const { file_url } = await uploadCoreFile(file);
                              await updateCustomer(customerId, { dsgvo_document_url: file_url });
                              await logDocumentUploaded(customerId, getCustomerDisplayName(), "DSGVO-Einwilligung");
                              queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
                            } catch (error) {
                              console.error('Upload failed:', error);
                            }
                            setUploading(false);
                          }}
                          disabled={uploading}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </div>
                    </div>
                  )}
                </Card>

                {/* Weitere Dokumente - als Optimierungsbereich */}
                <Card className="app-form-panel p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-[#FFD24D]/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-[#FFD24D]" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">Zusätzliche Unterlagen</h4>
                      <p className="text-xs text-muted-foreground">Optional, aber spart Zeit im Tagesgeschäft</p>
                    </div>
                  </div>

                  {/* Mehrwert-Erklärung */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
                    <div className="p-4 bg-[#1F2228] rounded-xl border border-[#2D3139]">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-[#FFD24D]" />
                        <span className="text-sm font-medium text-foreground">Schnellere Bearbeitung</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Mit hinterlegtem Ausweis und IBAN laufen Vertragsänderungen und Provider-Rückfragen deutlich schneller.
                      </p>
                    </div>
                    <div className="p-4 bg-[#1F2228] rounded-xl border border-[#2D3139]">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-[#FFD24D]" />
                        <span className="text-sm font-medium text-foreground">Weniger Rückfragen</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Provider fordern oft Nachweise an. Mit vollständiger Akte vermeiden Sie nervige Wartezeiten.
                      </p>
                    </div>
                    <div className="p-4 bg-[#1F2228] rounded-xl border border-[#2D3139]">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-[#FFD24D]" />
                        <span className="text-sm font-medium text-foreground">Stressfreie Vertretung</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Auch Kollegen können Kundenanliegen bearbeiten, wenn alle Unterlagen zentral vorliegen.
                      </p>
                    </div>
                  </div>

                  {/* Upload-Bereich */}
                  <div className="mb-6">
                    <Label htmlFor="doc-upload" className="cursor-pointer block">
                      <div className="border-2 border-dashed border-[#2D3139] rounded-xl p-8 text-center hover:border-[#FFD24D]/50 hover:bg-[#1F2228]/50 transition-all group">
                        <div className="h-14 w-14 mx-auto rounded-2xl bg-[#FFD24D]/10 flex items-center justify-center group-hover:bg-[#FFD24D]/20 transition-all mb-4">
                          <Upload className="h-7 w-7 text-[#FFD24D]  transition-transform" />
                        </div>
                        <p className="text-foreground font-semibold text-base mb-2">Unterlagen jetzt ergänzen</p>
                        <p className="text-sm text-muted-foreground">
                          PDF, JPG oder PNG • oder später stressfrei nachreichen
                        </p>
                      </div>
                    </Label>
                    <input
                      id="doc-upload"
                      type="file"
                      className="hidden"
                      onChange={handleDocumentUpload}
                      disabled={uploading}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </div>

                  {/* Dokumenten-Empfehlungen */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      identityDocs.some(d => (d.name || "").toLowerCase().includes('ausweis') || (d.name || "").toLowerCase().includes('id'))
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-[#1F2228] border-[#2D3139]"
                    )}>
                      <IdCard className={cn(
                        "h-5 w-5",
                        identityDocs.some(d => (d.name || "").toLowerCase().includes('ausweis') || (d.name || "").toLowerCase().includes('id'))
                          ? "text-emerald-400"
                          : "text-muted-foreground"
                      )} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Personalausweis</p>
                        <p className="text-xs text-muted-foreground">Für Identitätsprüfungen</p>
                      </div>
                      {identityDocs.some(d => (d.name || "").toLowerCase().includes('ausweis') || (d.name || "").toLowerCase().includes('id')) && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      identityDocs.some(d => (d.name || "").toLowerCase().includes('iban') || (d.name || "").toLowerCase().includes('bank'))
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-[#1F2228] border-[#2D3139]"
                    )}>
                      <CreditCard className={cn(
                        "h-5 w-5",
                        identityDocs.some(d => (d.name || "").toLowerCase().includes('iban') || (d.name || "").toLowerCase().includes('bank'))
                          ? "text-emerald-400"
                          : "text-muted-foreground"
                      )} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">IBAN / Bankkarte</p>
                        <p className="text-xs text-muted-foreground">Für Lastschriftverfahren</p>
                      </div>
                      {identityDocs.some(d => (d.name || "").toLowerCase().includes('iban') || (d.name || "").toLowerCase().includes('bank')) && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>
                  </div>

                  {/* Hochgeladene Dokumente */}
                  {identityDocs.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Hinterlegte Unterlagen
                      </p>
                      {identityDocs.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-[#1F2228] border border-[#2D3139] rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-[#FFD24D]" />
                            <div>
                              <p className="font-medium text-foreground">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Hochgeladen am {safeFormatDate(doc.date, 'dd.MM.yyyy')}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.url, '_blank')}
                            className="border-[#2D3139] text-foreground hover:bg-[#1F2228]"
                          >
                            Ansehen
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {identityDocs.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-sm">Noch keine zusätzlichen Unterlagen hinterlegt</p>
                      <p className="text-xs mt-1">Können jederzeit ergänzt werden – der Kunde ist bereits vollständig nutzbar</p>
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>
          </Tabs>
      }

      {/* DSGVO Preview Modal */}
      <DSGVOPreviewModal
        open={showDsgvoPreview}
        onOpenChange={setShowDsgvoPreview}
        formData={formData}
        customerType={customerType}
        addressData={addressData}
      />
    </motion.div>
  );
}
