/**
 * Parst Suchtext und errät Intent (phone, address, name)
 */
export function parseSearchIntent(searchTerm) {
  if (!searchTerm) return { type: 'name', value: searchTerm };

  const term = searchTerm.trim();
  
  // Phone detection: überwiegend Ziffern, + am Anfang, oder min 8 Ziffern
  const digitCount = (term.match(/\d/g) || []).length;
  const hasPlus = term.startsWith('+');
  const phonePattern = /^(\+?\d[\d\s\-()]{7,}|\d{4,}\s?\d+)$/;
  
  if (hasPlus || digitCount >= 8 || phonePattern.test(term)) {
    return { 
      type: 'phone', 
      value: term.replace(/[\s\-()]/g, '') // Clean up
    };
  }
  
  // Address detection: enthält Straße/str/platz/weg + Zahl
  const addressKeywords = /\b(straße|strasse|str\.?|str|platz|pl\.?|weg|allee)\b/i;
  const hasNumber = /\d/.test(term);
  const hasComma = term.includes(',');
  
  if ((addressKeywords.test(term) && hasNumber) || hasComma) {
    return { 
      type: 'address', 
      value: term 
    };
  }
  
  // Default: Name
  return { 
    type: 'name', 
    value: term 
  };
}