/**
 * Provider Registry - Single Source of Truth für rechtliche Empfängerdaten
 * Wird für Kündigungen, offizielle Schreiben, etc. verwendet
 */

export const PROVIDER_REGISTRY = {
  o2: {
    providerKey: "o2",
    displayName: "o2",
    legalEntityName: "Telefónica Germany GmbH & Co. OHG",
    addressLines: [
      "Kundenservice",
      "Postfach 60 10 63",
      "81210 München",
      "Deutschland"
    ]
  },
  
  telekom: {
    providerKey: "telekom",
    displayName: "Telekom",
    legalEntityName: "Telekom Deutschland GmbH",
    addressLines: [
      "Kundenservice",
      "Landgrabenweg 151",
      "53227 Bonn",
      "Deutschland"
    ]
  },
  
  vodafone: {
    providerKey: "vodafone",
    displayName: "Vodafone",
    legalEntityName: "Vodafone GmbH",
    addressLines: [
      "Kundenbetreuung",
      "Ferdinand-Braun-Platz 1",
      "40549 Düsseldorf",
      "Deutschland"
    ]
  },
  
  "1und1": {
    providerKey: "1und1",
    displayName: "1&1",
    legalEntityName: "1&1 Telecom GmbH",
    addressLines: [
      "Kundenservice",
      "Elgendorfer Straße 57",
      "56410 Montabaur",
      "Deutschland"
    ]
  },
  
  congstar: {
    providerKey: "congstar",
    displayName: "congstar",
    legalEntityName: "congstar GmbH",
    addressLines: [
      "Kundenservice",
      "Bayenwerft 12-14",
      "50678 Köln",
      "Deutschland"
    ]
  },
  
  blau: {
    providerKey: "blau",
    displayName: "Blau",
    legalEntityName: "Telefónica Germany GmbH & Co. OHG",
    addressLines: [
      "Kundenservice Blau",
      "Postfach 60 10 63",
      "81210 München",
      "Deutschland"
    ]
  },
  
  ay_yildiz: {
    providerKey: "ay_yildiz",
    displayName: "Ay Yıldız",
    legalEntityName: "Telefónica Germany GmbH & Co. OHG",
    addressLines: [
      "Kundenservice Ay Yıldız",
      "Postfach 60 10 63",
      "81210 München",
      "Deutschland"
    ]
  },
  
  yourfone: {
    providerKey: "yourfone",
    displayName: "yourfone",
    legalEntityName: "Drillisch Online GmbH",
    addressLines: [
      "Kundenservice",
      "Wilhelm-Röntgen-Straße 1-5",
      "63477 Maintal",
      "Deutschland"
    ]
  },
  
  pyur: {
    providerKey: "pyur",
    displayName: "PYUR",
    legalEntityName: "Tele Columbus AG",
    addressLines: [
      "Kundenservice",
      "Kaiserin-Augusta-Allee 108",
      "10553 Berlin",
      "Deutschland"
    ]
  }
};

/**
 * Ermittelt Provider-Daten für Kündigung
 * Falls Provider nicht in Registry: generiert Fallback aus Contract-Daten
 */
export function getProviderForCancellation(contract, provider) {
  // Versuche zuerst via Provider-Name (normalisiert)
  const normalizedName = contract.provider_name?.toLowerCase().replace(/\s+/g, '').replace(/&/g, 'und');
  
  // Exakte Matches
  if (normalizedName?.includes('telekom')) return PROVIDER_REGISTRY.telekom;
  if (normalizedName?.includes('vodafone')) return PROVIDER_REGISTRY.vodafone;
  if (normalizedName?.includes('o2')) return PROVIDER_REGISTRY.o2;
  if (normalizedName?.includes('1und1') || normalizedName?.includes('1&1')) return PROVIDER_REGISTRY["1und1"];
  if (normalizedName?.includes('congstar')) return PROVIDER_REGISTRY.congstar;
  if (normalizedName?.includes('blau')) return PROVIDER_REGISTRY.blau;
  if (normalizedName?.includes('ayyildiz') || normalizedName?.includes('yildiz')) return PROVIDER_REGISTRY.ay_yildiz;
  if (normalizedName?.includes('yourfone')) return PROVIDER_REGISTRY.yourfone;
  if (normalizedName?.includes('pyur')) return PROVIDER_REGISTRY.pyur;
  
  // Fallback: generiere aus vorhandenen Daten
  return {
    providerKey: "custom",
    displayName: contract.provider_name || "Provider",
    legalEntityName: contract.provider_name || "Provider",
    addressLines: provider?.address 
      ? [
          provider.address,
          `${provider.postal_code} ${provider.city}`.trim()
        ].filter(Boolean)
      : ["Kundenservice"]
  };
}

/**
 * Hilfsfunktion: alle Provider auflisten
 */
export function getAllProviders() {
  return Object.values(PROVIDER_REGISTRY);
}