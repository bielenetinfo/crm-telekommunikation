export const ROUTES = {
  Dashboard: '/',
  Customers: '/customers',
  CustomerDetail: '/customers/detail',
  Contracts: '/contracts',
  ContractDetail: '/contracts/detail',
  VVL: '/vvl',
  Providers: '/providers',
  Tasks: '/tasks',
  Backup: '/backup',
  Branches: '/branches',
  BranchDetail: '/branches/detail',
  Users: '/users',
  UserDetail: '/users/detail',
  Settings: '/settings',
  Hardware: '/hardware',
  Calendar: '/calendar',
  Reminders: '/reminders',
  Login: '/login'
} as const;

export type RouteName = keyof typeof ROUTES;
