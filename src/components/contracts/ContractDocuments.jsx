import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ContractDocuments({ contract, onDocumentsUpdate }) {
  const [uploading, setUploading] = useState(false);

  const documents = contract?.contract_documents 
    ? JSON.parse(contract.contract_documents) 
    : [];

  const handleUpload = async (e, docType = 'contract') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const newDoc = {
        url: file_url,
        name: file.name,
        date: new Date().toISOString(),
        type: docType
      };
      
      const updatedDocs = [...documents, newDoc];
      
      await base44.entities.Contract.update(contract.id, {
        contract_documents: JSON.stringify(updatedDocs)
      });

      // Log to customer history
      await base44.entities.CustomerHistory.create({
        customer_id: contract.customer_id,
        customer_name: contract.customer_name,
        type: 'note',
        title: 'Vertragsdokument hochgeladen',
        notes: `Dateiname: ${file.name}`,
        channel: 'store',
        status: 'done',
        occurred_at: new Date().toISOString(),
        contract_id: contract.id,
        priority: 'low',
        tags: JSON.stringify(['dokument']),
        is_system_event: false
      });

      toast.success('Dokument hochgeladen');
      onDocumentsUpdate?.();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload fehlgeschlagen');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (index) => {
    if (!confirm('Dokument wirklich entfernen?')) return;

    const updatedDocs = documents.filter((_, i) => i !== index);
    
    await base44.entities.Contract.update(contract.id, {
      contract_documents: JSON.stringify(updatedDocs)
    });

    toast.success('Dokument entfernt');
    onDocumentsUpdate?.();
  };

  return (
    <Card className="p-5 bg-[#181B21] border-[#2D3139]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#EAECEF]">Vertragsdokumente</h3>
        <Badge className="bg-[#FFD24D]/20 text-[#FFD24D] border border-[#FFD24D]/30">
          {documents.length} {documents.length === 1 ? 'Dokument' : 'Dokumente'}
        </Badge>
      </div>

      {/* Upload Area */}
      <Label htmlFor="doc-upload" className="cursor-pointer block">
        <div className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-all mb-4 group",
          uploading 
            ? "border-blue-500/50 bg-blue-500/5" 
            : "border-[#2D3139] hover:border-[#FFD24D]/50 hover:bg-[#1F2228]/50"
        )}>
          {uploading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="h-6 w-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-base text-blue-400 font-medium">Wird hochgeladen...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-[#FFD24D]/10 flex items-center justify-center group-hover:bg-[#FFD24D]/20 transition-all">
                <Upload className="h-7 w-7 text-[#FFD24D]" />
              </div>
              <div>
                <p className="text-[#EAECEF] font-semibold text-base mb-1">Klicken zum Hochladen</p>
                <p className="text-sm text-[#6B7280]">PDF, JPG oder PNG • Mehrere Dateien möglich</p>
              </div>
            </div>
          )}
        </div>
      </Label>
      <input
        id="doc-upload"
        type="file"
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
        accept=".pdf,.jpg,.jpeg,.png"
      />

      {/* Documents List */}
      {documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((doc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-[#1F2228] border border-[#2D3139] rounded-lg hover:border-[#FFD24D]/30 transition-all"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-[#FFD24D] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#EAECEF] font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-[#6B7280]">
                    {format(new Date(doc.date), 'dd.MM.yyyy HH:mm', { locale: de })}
                    {doc.type && doc.type !== 'contract' && ` • ${doc.type}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(doc.url, '_blank')}
                  className="border-[#2D3139] text-[#9CA3AF] hover:text-[#FFD24D]"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ansehen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(idx)}
                  className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-[#6B7280]">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Noch keine Dokumente hochgeladen</p>
        </div>
      )}
    </Card>
  );
}