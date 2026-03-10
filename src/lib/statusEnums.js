export const CUSTOMER_LIFECYCLE_PHASES = {
  LEAD: 'lead',
  QUALIFIED: 'qualifiziert',
  OFFER: 'angebot',
  ACTIVE: 'aktivkunde'
};

export const CUSTOMER_LIFECYCLE_PHASE_OPTIONS = [
  { value: CUSTOMER_LIFECYCLE_PHASES.LEAD, label: 'Lead' },
  { value: CUSTOMER_LIFECYCLE_PHASES.QUALIFIED, label: 'Qualifiziert' },
  { value: CUSTOMER_LIFECYCLE_PHASES.OFFER, label: 'Angebot' },
  { value: CUSTOMER_LIFECYCLE_PHASES.ACTIVE, label: 'Aktivkunde' }
];

export const CONTRACT_STATUS = {
  ACTIVE: 'aktiv',
  CANCELLED: 'gekündigt',
  EXPIRED: 'abgelaufen',
  RENEWED: 'verlängert',
  REPLACED: 'ersetzt'
};

export const CONTRACT_STATUS_OPTIONS = [
  { value: CONTRACT_STATUS.ACTIVE, label: 'Aktiv' },
  { value: CONTRACT_STATUS.CANCELLED, label: 'Gekündigt' },
  { value: CONTRACT_STATUS.EXPIRED, label: 'Abgelaufen' },
  { value: CONTRACT_STATUS.RENEWED, label: 'Verlängert' }
];
