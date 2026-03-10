export const ROLES = {
  ADMIN: 'admin',
  SALES: 'vertrieb',
  BACKOFFICE: 'backoffice',
  BRANCH_MANAGER: 'filialleiter'
};

export const MODULES = {
  DASHBOARD: 'dashboard',
  CUSTOMERS: 'customers',
  CONTRACTS: 'contracts',
  USERS: 'users',
  BACKUP: 'backup',
  SETTINGS: 'settings',
  REPORTS: 'reports'
};

export const FIELD_GROUPS = {
  CUSTOMER_PRIVATE_DATA: 'customer_private_data',
  CONTRACT_FINANCIALS: 'contract_financials',
  USER_SECURITY: 'user_security'
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    modules: Object.values(MODULES),
    fields: Object.values(FIELD_GROUPS),
    actions: ['delete', 'export', 'contract_change', 'backup_restore', 'user_management']
  },
  [ROLES.SALES]: {
    modules: [MODULES.DASHBOARD, MODULES.CUSTOMERS, MODULES.CONTRACTS],
    fields: [FIELD_GROUPS.CUSTOMER_PRIVATE_DATA, FIELD_GROUPS.CONTRACT_FINANCIALS],
    actions: ['contract_change']
  },
  [ROLES.BACKOFFICE]: {
    modules: [MODULES.DASHBOARD, MODULES.CUSTOMERS, MODULES.CONTRACTS, MODULES.REPORTS],
    fields: [FIELD_GROUPS.CUSTOMER_PRIVATE_DATA, FIELD_GROUPS.CONTRACT_FINANCIALS],
    actions: ['export', 'contract_change']
  },
  [ROLES.BRANCH_MANAGER]: {
    modules: [MODULES.DASHBOARD, MODULES.CUSTOMERS, MODULES.CONTRACTS, MODULES.REPORTS, MODULES.BACKUP],
    fields: [FIELD_GROUPS.CUSTOMER_PRIVATE_DATA, FIELD_GROUPS.CONTRACT_FINANCIALS],
    actions: ['export', 'contract_change', 'backup_restore']
  }
};

export function getUserRole(user) {
  return user?.role || ROLES.SALES;
}

export function canAccessModule(user, moduleName) {
  const permissions = ROLE_PERMISSIONS[getUserRole(user)];
  return permissions?.modules?.includes(moduleName) ?? false;
}

export function canAccessFieldGroup(user, fieldGroup) {
  const permissions = ROLE_PERMISSIONS[getUserRole(user)];
  return permissions?.fields?.includes(fieldGroup) ?? false;
}

export function canExecuteAction(user, actionName) {
  const permissions = ROLE_PERMISSIONS[getUserRole(user)];
  return permissions?.actions?.includes(actionName) ?? false;
}
