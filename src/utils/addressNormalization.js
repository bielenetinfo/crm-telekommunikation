/**
 * Normalisiert eine Adresse für konsistentes Matching.
 * Vereinheitlichte Fassung (ehemals in components/utils/addressNormalization.jsx).
 */
export function normalizeAddress(street, houseNumber, postalCode, city) {
  if (!street || !postalCode || !city) return "";

  // Straße normalisieren
  let normalizedStreet = street
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ") // Mehrfach-Spaces entfernen
    .replace(/straße/g, "str")
    .replace(/strasse/g, "str")
    .replace(/platz/g, "pl")
    .replace(/weg/g, "wg");

  // Hausnummer normalisieren
  const normalizedHouseNumber = houseNumber?.trim().toLowerCase() || "";

  // PLZ und Stadt normalisieren
  const normalizedPostalCode = postalCode.trim();
  const normalizedCity = city.toLowerCase().trim().replace(/\s+/g, " ");

  // Zusammensetzen
  return `${normalizedStreet} ${normalizedHouseNumber}, ${normalizedPostalCode} ${normalizedCity}`.trim();
}

/**
 * Prüft ob zwei normalisierte Adressen exakt gleich sind.
 */
export function addressesMatch(normalized1, normalized2) {
  if (!normalized1 || !normalized2) return false;
  return normalized1 === normalized2;
}

/**
 * Berechnet Match-Score für Autocomplete.
 */
export function calculateAddressMatchScore(searchTerm, normalized) {
  if (!normalized || !searchTerm) return 0;

  const term = searchTerm.toLowerCase().trim();

  // Exakte Übereinstimmung
  if (normalized === term) return 100;

  // StartsWith
  if (normalized.startsWith(term)) return 80;

  // Contains
  if (normalized.includes(term)) return 60;

  // Teilstring-Match auf PLZ oder Straße
  const parts = normalized.split(",");
  for (const part of parts) {
    if (part.trim().startsWith(term)) return 70;
    if (part.includes(term)) return 50;
  }

  return 0;
}
