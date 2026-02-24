import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileCheck, ExternalLink, RefreshCw } from "lucide-react";
import { generateDSGVOPDF } from "@/components/pdf/dsgvoPdf";
import { downloadBlob } from "@/components/pdf/downloadHelper";
import { toast } from "sonner";

export default function DSGVOPreviewModal({
    open,
    onOpenChange,
    formData,
    customerType,
    addressData,
    signingCity
}) {
    const [pdfDataUrl, setPdfDataUrl] = useState(null);
    const [pdfBlob, setPdfBlob] = useState(null);
    const [fileName, setFileName] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (open && formData && addressData) {
            generatePDF();
        }

        return () => {
            setPdfDataUrl(null);
        };
    }, [open, formData, addressData]);

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const result = generateDSGVOPDF({
                formData,
                customerType,
                addressData,
                signingCity
            });

            if (!result || !result.blob) {
                throw new Error('PDF generation failed');
            }

            setPdfBlob(result.blob);
            setFileName(result.fileName);

            // Convert blob to data URL for inline display
            const reader = new FileReader();
            reader.onloadend = () => {
                setPdfDataUrl(reader.result);
                setIsGenerating(false);
            };
            reader.onerror = () => {
                console.error('Failed to read blob');
                setIsGenerating(false);
            };
            reader.readAsDataURL(result.blob);
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
                toast.success('DSGVO-Dokument heruntergeladen');
            } else {
                toast.error('Download fehlgeschlagen');
            }
        }
    };

    const handleOpenInNewTab = () => {
        if (pdfBlob) {
            const url = URL.createObjectURL(pdfBlob);
            window.open(url, '_blank');
            // Clean up after a delay
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col bg-card border-border">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl text-foreground">
                            DSGVO-Einwilligungserklärung
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleOpenInNewTab}
                                className="border-border"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Im neuen Tab öffnen
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleDownload}
                                className="bg-gradient-to-r from-primary to-orange-400 text-primary-foreground hover:from-primary/90 hover:to-orange-500"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                PDF herunterladen
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* PDF Preview */}
                <div className="flex-1 min-h-0 overflow-hidden rounded-lg border-2 border-border bg-white">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[500px]">
                            <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
                            <p className="text-muted-foreground">PDF wird generiert...</p>
                        </div>
                    ) : pdfDataUrl ? (
                        <embed
                            src={pdfDataUrl}
                            type="application/pdf"
                            className="w-full h-full min-h-[500px]"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[500px] p-8 text-center">
                            <p className="text-foreground mb-2 font-medium">PDF konnte nicht geladen werden</p>
                            <div className="flex gap-2">
                                <Button onClick={generatePDF} variant="outline">
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

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileCheck className="h-4 w-4" />
                        <span>{fileName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-border text-muted-foreground hover:bg-secondary"
                        >
                            Schließen
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
