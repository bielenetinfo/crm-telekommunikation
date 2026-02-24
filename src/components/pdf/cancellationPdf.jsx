import jsPDF from "jspdf";
import { format } from "date-fns";
import { de } from "date-fns/locale";

/**
 * Erstellt ein TKG-konformes Kündigungs-PDF
 * Layout: Kunde als Absender, Provider als Empfänger (juristisch korrekt)
 */
export function generateCancellationPDF({ 
  customer, 
  contract, 
  providerData,
  customizations = {}
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 20;

  // Customizations mit Defaults
  const categoryLabel = {
    mobilfunk: "Mobilfunk",
    festnetz: "Festnetz",
    internet: "Internet / DSL",
    tv: "TV",
    kombi: "Kombivertrag",
    sonstiges: "Telekommunikation"
  }[contract.category] || contract.category;
  
  const betreff = customizations.betreff || `Kündigung Telekommunikationsvertrag – ${categoryLabel}`;
  const includeCustomerService = customizations.includeCustomerService !== false;
  const customText = customizations.customText || null;
  const includeDsgvo = customizations.includeDsgvo || false;

  // Helper
  const addText = (text, x, yPos, maxWidth = pageWidth - 40, align = 'left') => {
    const lines = doc.splitTextToSize(text, maxWidth);
    if (align === 'left') {
      doc.text(lines, x, yPos);
    } else {
      lines.forEach((line, idx) => {
        doc.text(line, x, yPos + (idx * 5), { align });
      });
    }
    return yPos + (lines.length * 5);
  };

  // Header Branding (BIELENET - klein, als Service-Marker)
  doc.setFillColor(255, 210, 77);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(15, 17, 21);
  doc.text("BIELENET", 20, 14);
  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  doc.text("CRM – Kündigungsservice", 20, 19);

  // Datum rechtsbündig
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(`Erstellt: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr`, pageWidth - 20, 14, { align: 'right' });
  
  y = 40;
  doc.setTextColor(0, 0, 0);

  // ABSENDER (Kunde - ist der rechtliche Absender)
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  
  const customerName = customer.customer_type === "geschäftlich"
    ? customer.company_name
    : `${customer.first_name} ${customer.last_name}`;
  
  doc.text(customerName, 20, y);
  y += 5;
  doc.setFont(undefined, 'normal');
  
  doc.text(`${customer.address}`, 20, y);
  y += 5;
  doc.text(`${customer.postal_code} ${customer.city}`, 20, y);
  y += 5;
  
  if (customer.phone) {
    doc.setFontSize(9);
    doc.text(`Tel: ${customer.phone}`, 20, y);
    y += 4;
  }
  if (customer.email) {
    doc.setFontSize(9);
    doc.text(`E-Mail: ${customer.email}`, 20, y);
    y += 4;
  }
  
  y += 8;

  // EMPFÄNGER (Provider - juristisch korrekt)
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(providerData.legalEntityName, 20, y);
  y += 6;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  
  // Addresslines aus Registry
  if (includeCustomerService && providerData.addressLines[0]) {
    doc.text(providerData.addressLines[0], 20, y);
    y += 5;
  }
  
  for (let i = (includeCustomerService ? 1 : 0); i < providerData.addressLines.length; i++) {
    doc.text(providerData.addressLines[i], 20, y);
    y += 5;
  }
  
  y += 10;

  // BETREFF
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  y = addText(betreff, 20, y, pageWidth - 40);
  y += 8;

  // VERTRAGSDATEN BOX
  doc.setFillColor(245, 245, 245);
  const boxHeight = 35;
  doc.roundedRect(20, y, pageWidth - 40, boxHeight, 2, 2, 'F');
  y += 7;

  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text("VERTRAGSDATEN", 25, y);
  y += 6;
  doc.setFont(undefined, 'normal');

  doc.text(`Vertragsnummer: ${contract.contract_number || 'siehe Vertragsunterlagen'}`, 25, y);
  y += 5;
  doc.text(`Vertragsart: ${contract.category} • Beginn: ${format(new Date(contract.start_date), 'dd.MM.yyyy')}`, 25, y);
  y += 5;
  
  if (contract.cancellation_deadline) {
    doc.text(`Kündigungsfrist: ${format(new Date(contract.cancellation_deadline), 'dd.MM.yyyy')}`, 25, y);
    y += 5;
  }
  
  if (contract.contract_duration_months) {
    doc.text(`Vertragslaufzeit: ${contract.contract_duration_months} Monate`, 25, y);
  }
  
  y += 12;

  // ANREDE
  doc.setFontSize(10);
  doc.text("Sehr geehrte Damen und Herren,", 20, y);
  y += 10;

  // KÜNDIGUNGSTEXT (TKG-konform)
  let cancellationText = customText || `hiermit kündige ich den oben genannten Telekommunikationsvertrag fristgerecht zum nächstmöglichen Zeitpunkt${contract.cancellation_deadline ? `, spätestens zum ${format(new Date(contract.cancellation_deadline), 'dd.MM.yyyy')}` : ''}.

Sollte die Kündigung zum genannten Zeitpunkt nicht möglich sein, kündige ich hilfsweise zum nächstmöglichen Termin.

Bitte senden Sie mir eine schriftliche Kündigungsbestätigung unter Angabe des Beendigungszeitpunkts zu.`;

  if (includeDsgvo) {
    cancellationText += `\n\nIch bitte um Löschung meiner personenbezogenen Daten nach Ablauf der gesetzlichen Aufbewahrungsfristen gemäß DSGVO.`;
  }

  y = addText(cancellationText, 20, y, pageWidth - 40);
  y += 10;

  // GRUßFORMEL
  doc.text("Mit freundlichen Grüßen", 20, y);
  y += 20;

  // UNTERSCHRIFT PLATZHALTER
  doc.setDrawColor(180, 180, 180);
  doc.line(20, y, 90, y);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Unterschrift", 20, y);
  y += 3;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(customerName, 20, y);

  // FOOTER
  const footerY = pageHeight - 12;
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Kündigung erstellt von BIELENET CRM | ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr`, pageWidth / 2, footerY, { align: 'center' });

  // Rückgabe als Blob (application/pdf)
  return doc.output('blob');
}

/**
 * Sicherer Dateiname
 */
export function getCancellationFileName(customer, contract, providerData) {
  const customerName = customer.customer_type === "geschäftlich"
    ? customer.company_name
    : customer.last_name;
  
  const providerKey = providerData.providerKey || "Vertrag";
  const date = format(new Date(), 'yyyy-MM-dd');

  const safeName = (str) => str
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-zA-Z0-9]/g, '_');

  return `Kuendigung_${safeName(providerKey)}_${safeName(customerName)}_${date}.pdf`;
}