import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Download, Save, FileCheck, Edit3, Eye, RefreshCw } from "lucide-react";
import { generateCancellationPDF, getCancellationFileName } from "@/components/pdf/cancellationPdf";
import { downloadBlob } from "@/components/pdf/downloadHelper";
import { getProviderForCancellation } from "@/components/providers/ProviderRegistry";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CancellationModal({
  open,
  onOpenChange,
  customer,
  contract,
  provider,
  branch,
  onDocumentSaved
}) {
  const [pdfDataUrl, setPdfDataUrl] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Editierbare Felder
  const [betreff, setBetreff] = useState("");
  const [customText, setCustomText] = useState("");
  const [includeCustomerService, setIncludeCustomerService] = useState(true);
  const [includeDsgvo, setIncludeDsgvo] = useState(false);

  const [providerData, setProviderData] = useState(null);

  useEffect(() => {
    if (open && customer && contract) {
      const pData = getProviderForCancellation(contract, provider);
      setProviderData(pData);

      // Defaults setzen
      const categoryLabel = {
        mobilfunk: "Mobilfunk",
        festnetz: "Festnetz",
        internet: "Internet / DSL",
        tv: "TV",
        kombi: "Kombivertrag",
        sonstiges: "Telekommunikation"
      }[contract.category] || contract.category;

      setBetreff(`Kündigung Telekommunikationsvertrag – ${categoryLabel}`);
      setCustomText("");
      setIncludeCustomerService(true);
      setIncludeDsgvo(false);
      setIsEditMode(false);

      generatePDF(pData);
    }

    return () => {
      setPdfDataUrl(null);
    };
  }, [open, customer, contract]);

  const generatePDF = (pData = providerData) => {
    if (!pData) return;
    setIsGenerating(true);

    try {
      const customizations = {
        betreff,
        customText: customText || null,
        includeCustomerService,
        includeDsgvo
      };

      const blob = generateCancellationPDF({
        customer,
        contract,
        providerData: pData,
        customizations
      });

      // Validiere dass es wirklich ein PDF ist
      if (blob.type !== 'application/pdf') {
        throw new Error('Generated blob is not a PDF');
      }

      const name = getCancellationFileName(customer, contract, pData);
      setPdfBlob(blob);
      setFileName(name);

      // Convert blob to data URL for inline display
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfDataUrl(reader.result);
        setIsGenerating(false);
        if (isEditMode) {
          toast.success('PDF aktualisiert');
        }
      };
      reader.onerror = () => {
        console.error('Failed to read blob');
        setIsGenerating(false);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('PDF konnte nicht erstellt werden');
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (pdfBlob && fileName) {
      const success = downloadBlob(pdfBlob, fileName);
      if (success) {
        toast.success('Kündigung heruntergeladen');
      } else {
        toast.error('Download fehlgeschlagen');
      }
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  };

  const handleSaveAsDocument = async () => {
    if (!pdfBlob) return;

    setIsSaving(true);
    try {
      // Upload PDF
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Speichere als Dokument beim Kunden
      const currentDocs = customer.identity_documents
        ? JSON.parse(customer.identity_documents)
        : [];
      const newDocs = [...currentDocs, {
        url: file_url,
        name: fileName,
        type: 'cancellation',
        contractId: contract.id,
        providerKey: providerData.providerKey,
        date: new Date().toISOString()
      }];

      await base44.entities.Customer.update(customer.id, {
        identity_documents: JSON.stringify(newDocs)
      });

      // Historie-Eintrag
      const customerName = customer.customer_type === "geschäftlich"
        ? customer.company_name
        : `${customer.first_name} ${customer.last_name}`;

      await base44.entities.CustomerHistory.create({
        customer_id: customer.id,
        customer_name: customerName,
        type: "system",
        title: "Kündigung erstellt",
        notes: `Vertrag ${contract.provider_name} (${contract.category}) gekündigt`,
        channel: "store",
        status: "done",
        occurred_at: new Date().toISOString(),
        contract_id: contract.id,
        priority: "high",
        tags: JSON.stringify(["cancellation", "document"]),
        is_system_event: false
      });

      toast.success('Kündigung als Dokument gespeichert');
      onDocumentSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save document:', error);
      toast.error('Dokument konnte nicht gespeichert werden');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyEdits = () => {
    generatePDF();
    setIsEditMode(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col bg-[#181B21] border-[#2D3139]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl text-[#EAECEF]">
              Kündigungs-PDF
            </DialogTitle>
            <div className="flex items-center gap-2">
              {!isEditMode ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditMode(true)}
                    className="border-[#2D3139] text-[#9CA3AF] hover:bg-[#1F2228]"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownload}
                    className="bg-gradient-to-r from-[#FFD24D] to-[#FFA500] text-[#0F1115] hover:from-[#E6BC3A] hover:to-[#E69500]"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditMode(false);
                    }}
                    className="border-[#2D3139] text-[#9CA3AF] hover:bg-[#1F2228]"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplyEdits}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Vorschau aktualisieren
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 gap-4">
          {/* PDF Preview */}
          <div className={cn(
            "flex-1 min-h-0 overflow-hidden rounded-lg border-2 border-border bg-white",
            isEditMode && "flex-[0.6]"
          )}>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">PDF wird generiert...</p>
              </div>
            ) : pdfDataUrl ? (
              <embed
                src={pdfDataUrl}
                type="application/pdf"
                className="w-full h-full min-h-[400px]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center">
                <p className="text-foreground mb-2 font-medium">PDF konnte nicht geladen werden</p>
                <div className="flex gap-2">
                  <Button onClick={() => generatePDF()} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Erneut versuchen
                  </Button>
                  <Button onClick={handleDownload} className="bg-primary text-primary-foreground">
                    <Download className="h-4 w-4 mr-2" />
                    PDF herunterladen
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Edit Panel */}
          {isEditMode && (
            <div className="flex-[0.4] overflow-y-auto space-y-4 p-4 bg-[#1F2228] rounded-lg border border-[#2D3139]">
              <h3 className="text-sm font-semibold text-[#EAECEF] uppercase tracking-wider">
                Anpassungen
              </h3>

              <div>
                <Label className="text-[#EAECEF] text-xs mb-2">Betreff</Label>
                <Input
                  value={betreff}
                  onChange={(e) => setBetreff(e.target.value)}
                  className="bg-[#0F1115] border-[#2D3139] text-[#EAECEF]"
                />
              </div>

              <div>
                <Label className="text-[#EAECEF] text-xs mb-2">Empfänger</Label>
                <div className="p-3 bg-[#0F1115] rounded-lg border border-[#2D3139]">
                  <p className="text-sm font-semibold text-[#EAECEF]">{providerData?.legalEntityName}</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {providerData?.addressLines.join(', ')}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Switch
                      checked={includeCustomerService}
                      onCheckedChange={setIncludeCustomerService}
                      className="data-[state=checked]:bg-[#FFD24D]"
                    />
                    <span className="text-xs text-[#9CA3AF]">
                      "Kundenservice" Zeile anzeigen
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-[#EAECEF] text-xs mb-2">Kündigungstext (optional)</Label>
                <Textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Leer lassen für Standard-Text"
                  rows={6}
                  className="bg-[#0F1115] border-[#2D3139] text-[#EAECEF] text-sm"
                />
                <p className="text-xs text-[#6B7280] mt-1">
                  Nur ausfüllen, wenn Sie vom Standard-Text abweichen möchten
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-[#0F1115] rounded-lg">
                <Switch
                  checked={includeDsgvo}
                  onCheckedChange={setIncludeDsgvo}
                  className="data-[state=checked]:bg-[#FFD24D]"
                />
                <div className="flex-1">
                  <p className="text-sm text-[#EAECEF]">DSGVO-Löschung anfragen</p>
                  <p className="text-xs text-[#6B7280]">
                    Fügt Absatz zur Datenlöschung hinzu
                  </p>
                </div>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-400">
                  ℹ️ Vertragsdaten bleiben unverändert und werden aus dem System übernommen
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#2D3139]">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <FileCheck className="h-4 w-4" />
            <span>{fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#2D3139] text-[#9CA3AF] hover:bg-[#1F2228]"
            >
              Schließen
            </Button>
            <Button
              onClick={handleSaveAsDocument}
              disabled={isSaving}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Speichert...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Als Dokument speichern
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}