export const ENTITY_STATUS_MODELS = {
  customers: {
    field: 'status',
    statuses: ['draft', 'aktiv', 'complete', 'archiviert'],
    transitions: {
      draft: ['aktiv', 'complete'],
      complete: ['archiviert'],
      aktiv: ['archiviert'],
      archiviert: []
    },
    happyPath: [
      { status: 'draft', title: 'Stammdaten aufnehmen' },
      { status: 'aktiv', title: 'Kundenprofil aktivieren' },
      { status: 'archiviert', title: 'Kunde abgeschlossen/archiviert' }
    ]
  },
  contracts: {
    field: 'status',
    statuses: ['draft', 'aktiv', 'gekündigt', 'verlängert', 'abgelaufen'],
    transitions: {
      draft: ['aktiv'],
      aktiv: ['gekündigt', 'verlängert', 'abgelaufen'],
      verlängert: ['gekündigt', 'abgelaufen'],
      gekündigt: ['abgelaufen'],
      abgelaufen: []
    },
    happyPath: [
      { status: 'draft', title: 'Vertrag erfassen' },
      { status: 'aktiv', title: 'Vertrag läuft' },
      { status: 'gekündigt', title: 'Kündigung dokumentiert' }
    ]
  },
  vvl: {
    field: 'vvl_status',
    statuses: ['offen', 'in_bearbeitung', 'angebot_erstellt', 'verlängert', 'gekündigt', 'nicht_verlaengert'],
    transitions: {
      offen: ['in_bearbeitung'],
      in_bearbeitung: ['angebot_erstellt', 'verlängert', 'gekündigt', 'nicht_verlaengert'],
      angebot_erstellt: ['verlängert', 'gekündigt', 'nicht_verlaengert'],
      verlängert: [],
      gekündigt: [],
      nicht_verlaengert: []
    },
    happyPath: [
      { status: 'offen', title: 'Vertrag wird fällig' },
      { status: 'in_bearbeitung', title: 'Kunde kontaktiert & Bedarf geklärt' },
      { status: 'verlängert', title: 'VVL erfolgreich abgeschlossen' }
    ]
  },
  tasks: {
    field: 'status',
    statuses: ['offen', 'in_bearbeitung', 'erledigt'],
    transitions: {
      offen: ['in_bearbeitung', 'erledigt'],
      in_bearbeitung: ['erledigt', 'offen'],
      erledigt: []
    },
    happyPath: [
      { status: 'offen', title: 'Aufgabe erstellt' },
      { status: 'in_bearbeitung', title: 'Aufgabe in Arbeit' },
      { status: 'erledigt', title: 'Aufgabe abgeschlossen' }
    ]
  },
  reminders: {
    field: 'status',
    statuses: ['offen', 'versendet', 'erledigt', 'ignoriert'],
    transitions: {
      offen: ['versendet', 'erledigt', 'ignoriert'],
      versendet: ['erledigt', 'ignoriert'],
      erledigt: [],
      ignoriert: []
    },
    happyPath: [
      { status: 'offen', title: 'Erinnerung erstellt' },
      { status: 'versendet', title: 'Kunde informiert' },
      { status: 'erledigt', title: 'Vorgang abgeschlossen' }
    ]
  }
};

export const getAllowedTransitions = (entityKey, fromStatus) => {
  const model = ENTITY_STATUS_MODELS[entityKey];
  if (!model) return [];
  return model.transitions[fromStatus] || [];
};

export const isValidStatusTransition = (entityKey, fromStatus, toStatus) => {
  if (!toStatus) return false;
  if (fromStatus === toStatus) return true;
  return getAllowedTransitions(entityKey, fromStatus).includes(toStatus);
};

export const getNextHappyPathStep = (entityKey, currentStatus) => {
  const model = ENTITY_STATUS_MODELS[entityKey];
  if (!model) return null;
  const transitions = getAllowedTransitions(entityKey, currentStatus);
  const next = model.happyPath.find(step => transitions.includes(step.status));
  return next || null;
};
