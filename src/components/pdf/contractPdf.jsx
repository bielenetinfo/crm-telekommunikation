import jsPDF from "jspdf";
import { format } from "date-fns";
import { de } from "date-fns/locale";

/**
 * Erstellt eine Vertragszusammenfassung als PDF
 */
export function generateContractPDF({
    customer,
    contract,
    customizations = {}
}) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 20;

    // Header Branding (BIELENET - Gold)
    doc.setFillColor(255, 210, 77);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(15, 17, 21);
    doc.text("BIELENET", 20, 14);
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.text("CRM – Vertragsübersicht", 20, 19);

    // Datum rechtsbündig
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`Erstellt: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr`, pageWidth - 20, 14, { align: 'right' });

    y = 40;
    doc.setTextColor(0, 0, 0);

    // Titelei
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text("Vertragszusammenfassung", 20, y);
    y += 10;

    // KUNDENDATEN
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');

    // Safely access customer data
    const safeCustomer = customer || {};
    const customerName = safeCustomer.customer_type === "geschäftlich"
        ? (safeCustomer.company_name || "Firma Unbekannt")
        : `${safeCustomer.first_name || ''} ${safeCustomer.last_name || ''}`.trim() || "Kunde Unbekannt";

    doc.text("Vertragspartner:", 20, y);
    y += 5;
    doc.setFont(undefined, 'normal');
    doc.text(customerName, 20, y);
    y += 5;
    doc.text(`${safeCustomer.street || ''} ${safeCustomer.house_number || ''}`, 20, y);
    y += 5;
    doc.text(`${safeCustomer.postal_code || ''} ${safeCustomer.city || ''}`, 20, y);

    y += 15;

    // VERTRAGSDETAILS BOX
    doc.setFillColor(245, 245, 245);
    // Estimate height: 10 lines * 6 = 60 + padding
    const boxHeight = 80;
    doc.roundedRect(20, y, pageWidth - 40, boxHeight, 2, 2, 'F');
    const boxStartY = y;

    y += 8;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(contract.provider_name || "Provider", 25, y);
    y += 8;

    doc.setFontSize(10);
    const rows = [
        { label: "Tarifname:", value: contract.tariff_name },
        { label: "Kategorie:", value: contract.category },
        { label: "Vertragsnummer:", value: contract.contract_number || "Nicht hinterlegt" },
        { label: "Status:", value: contract.status },
        { label: "Vertragsbeginn:", value: contract.start_date ? format(new Date(contract.start_date), 'dd.MM.yyyy') : '-' },
        { label: "Vertragsende:", value: contract.end_date ? format(new Date(contract.end_date), 'dd.MM.yyyy') : '-' },
        { label: "Kündigungsfrist:", value: contract.cancellation_deadline ? format(new Date(contract.cancellation_deadline), 'dd.MM.yyyy') : '-' },
        { label: "Monatliche Kosten:", value: contract.monthly_fee ? `${Number(contract.monthly_fee).toFixed(2).replace('.', ',')} €` : '-' },
    ];

    rows.forEach(row => {
        doc.setFont(undefined, 'bold');
        doc.text(row.label, 25, y);
        doc.setFont(undefined, 'normal');
        doc.text(String(row.value || '-'), 70, y);
        y += 6;
    });

    y = boxStartY + boxHeight + 15;

    // NOTIZEN (Optional)
    if (contract.notes) {
        doc.setFont(undefined, 'bold');
        doc.text("Notizen:", 20, y);
        y += 6;
        doc.setFont(undefined, 'normal');

        const lines = doc.splitTextToSize(contract.notes, pageWidth - 40);
        doc.text(lines, 20, y);
        y += (lines.length * 5) + 10;
    }

    // FOOTER
    const footerY = pageHeight - 12;
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(`Dokument generiert von BIELENET CRM | ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr`, pageWidth / 2, footerY, { align: 'center' });

    // Rückgabe als Blob
    return doc.output('blob');
}

export function getContractFileName(customer, contract) {
    const safeCustomer = customer || {};
    const customerName = safeCustomer.customer_type === "geschäftlich"
        ? (safeCustomer.company_name || "Firma")
        : (safeCustomer.last_name || "Kunde");

    const tariff = contract.tariff_name || "Vertrag";
    const date = format(new Date(), 'yyyy-MM-dd');

    const safeName = (str) => String(str || "")
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-zA-Z0-9]/g, '_');

    return `Vertrag_${safeName(tariff)}_${safeName(customerName)}_${date}.pdf`;
}
