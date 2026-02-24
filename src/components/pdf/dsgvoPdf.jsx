import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { de } from "date-fns/locale";

/**
 * Erstellt ein DSGVO-PDF für einen Kunden
 * Gibt Blob und Filename zurück (kein auto-download)
 * @param {Object} params
 * @param {Object} params.formData - Die Formulardaten des Kunden
 * @param {string} params.customerType - "privat" oder "geschäftlich"
 * @param {Object} params.addressData - Strukturierte Adressdaten
 */
export const generateDSGVOPDF = ({ formData, customerType, addressData, signingCity }) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. HEADER: Premium Brand Color Background & Logo Area
    doc.setFillColor(255, 210, 77); // #FFD24D Brand Yellow
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Header Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(15, 17, 21); // Almost Black
    doc.text("BIELENET", 20, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("IT- & Telekommunikationsdienstleistungen", 20, 30);

    // Header Right: Date
    const today = new Date();
    const dateStr = format(today, 'dd.MM.yyyy', { locale: de });
    doc.setFontSize(9);
    doc.text(`Bielefeld, den ${dateStr}`, pageWidth - 20, 30, { align: 'right' });

    let y = 60;

    // 2. TITLE SECTION
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Einwilligungserklärung gemäß DSGVO", pageWidth / 2, y, { align: 'center' });
    y += 15;

    // 3. INTRODUCTION
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const introText = "Hiermit willige ich in die Verarbeitung meiner personenbezogenen Daten durch die Firma BIELENET gemäß der Datenschutz-Grundverordnung (DSGVO) ein.";
    const splitIntro = doc.splitTextToSize(introText, pageWidth - 40);
    doc.text(splitIntro, 20, y);
    y += 15;

    // 4. CUSTOMER DATA BOX
    // Background
    doc.setFillColor(248, 249, 250); // Light Gray
    doc.setDrawColor(220, 220, 220); // Border
    doc.roundedRect(20, y, pageWidth - 40, 50, 3, 3, 'FD');

    const boxY = y + 12;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "bold");
    doc.text("KUNDENDATEN", 25, boxY);

    // Reset Logic
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Column 1: Identity
    const col1Ex = 25;
    let cY = boxY + 10;

    doc.setFont("helvetica", "bold");
    if (customerType === "privat") {
        doc.text(`${formData.last_name}, ${formData.first_name}`, col1Ex, cY);
        if (formData.birth_date) {
            cY += 5;
            doc.setFont("helvetica", "normal");
            doc.text(`Geb. am: ${format(new Date(formData.birth_date), 'dd.MM.yyyy')}`, col1Ex, cY);
        }
    } else {
        doc.text(formData.company_name || "", col1Ex, cY);
        cY += 5;
        doc.setFont("helvetica", "normal");
        const contactName = `${formData.contact_person_first_name || ""} ${formData.contact_person_last_name || ""}`.trim();
        doc.text(`AP: ${contactName}`, col1Ex, cY);
    }

    // Contact Details
    cY += 10;
    doc.setFont("helvetica", "normal");
    doc.text(`Tel: ${formData.phone || "-"}`, col1Ex, cY);
    cY += 5;
    doc.text(`E-Mail: ${formData.email || "-"}`, col1Ex, cY);

    // Column 2: Address
    const col2Ex = 110;
    cY = boxY + 10; // Reset Y for Col 2
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text("ANSCHRIFT", col2Ex, boxY); // Sub-Header

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");

    const street = `${addressData.street || ""} ${addressData.house_number || ""}`.trim();
    doc.text(street, col2Ex, cY);
    cY += 5;
    doc.text(`${addressData.postal_code || ""} ${addressData.city || ""}`, col2Ex, cY);

    y += 60; // Move past Box

    // 5. PURPOSE
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("1. Zweck der Datenverarbeitung", 20, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const purposeText = "Die Erhebung und Verarbeitung der Daten erfolgt ausschließlich zum Zweck der Vertragsanbahnung, -durchführung und -abwicklung von Telekommunikationsdienstleistungen sowie zur Kundenbetreuung.";
    const splitPurpose = doc.splitTextToSize(purposeText, pageWidth - 40);
    doc.text(splitPurpose, 20, y);
    y += splitPurpose.length * 5 + 10;

    // 6. CONSENTS
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("2. Einwilligungserklärung", 20, y);
    y += 8;

    // Helper to draw clean checkboxes
    const drawCheckbox = (px, py, checked, label, subLabel) => {
        doc.setDrawColor(50, 50, 50);
        doc.setLineWidth(0.1);
        doc.rect(px, py, 4, 4); // Box

        if (checked) {
            doc.setFont("zapfdingbats", "normal");
            doc.setFontSize(12);
            doc.text("4", px + 0.5, py + 3.2); // Checkmark
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(label, px + 8, py + 3);

        let addedHeight = 6;
        if (subLabel) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            const splitLabel = doc.splitTextToSize(subLabel, pageWidth - 40);
            doc.text(splitLabel, px + 8, py + 7);
            doc.setTextColor(0, 0, 0);
            addedHeight += splitLabel.length * 4;
        }
        return addedHeight + 4; // Padding
    };

    y += drawCheckbox(20, y, true, "Verarbeitung von Kontakt- und Adressdaten", "Erforderlich für Kommunikation und Rechnungsstellung.");
    y += drawCheckbox(20, y, true, "Verarbeitung von Vertragsdaten", "Dokumentation der Verträge und Laufzeiten.");

    y += 5;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Optionale Einwilligungen (Bitte ankreuzen)", 20, y);
    y += 8;

    y += drawCheckbox(20, y, false, "Speicherung von Bankdaten (IBAN)", "Erleichtert Zahlungsabwicklungen (Lastschrift).");
    y += drawCheckbox(20, y, false, "Kopie des Personalausweises", "Zur Identitätsprüfung bei Providern hinterlegt.");

    y += 15;

    // 7. RIGHTS
    doc.setDrawColor(220, 220, 220);
    doc.line(20, y, pageWidth - 20, y); // Separator Line
    y += 8;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const rightsText = "Hinweis: Sie haben jederzeit das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer Daten. Diese Einwilligung ist freiwillig und kann jederzeit mit Wirkung für die Zukunft widerrufen werden.";
    const splitRights = doc.splitTextToSize(rightsText, pageWidth - 40);
    doc.text(splitRights, 20, y);
    doc.setTextColor(0, 0, 0);
    y += 20;

    // 8. SIGNATURE AREA (Moved to bottom as requested)
    const sigY = doc.internal.pageSize.getHeight() - 40;

    // Lines
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    doc.line(20, sigY, 90, sigY);
    doc.line(110, sigY, 190, sigY);

    // Text under lines
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    // Dynamic Location/Date
    const actualSigningCity = signingCity || "Bielefeld";
    doc.text(`${actualSigningCity}, den ${dateStr}`, 20, sigY - 3);
    doc.text("Unterschrift Kunde/Kundin", 110, sigY + 5);

    // FOOTER
    const footY = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("Verantwortlicher: BIELENET IT- & Telekommunikationsdienstleistungen | DSGVO-Konform", pageWidth / 2, footY, { align: 'center' });

    const fileName = customerType === "privat"
        ? `DSGVO_${formData.last_name}_${formData.first_name}.pdf`
        : `DSGVO_${formData.company_name}.pdf`;

    // Return blob instead of auto-downloading
    return {
        blob: doc.output('blob'),
        fileName: fileName
    };
};
