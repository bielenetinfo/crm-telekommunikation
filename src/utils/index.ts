import { ROUTES, type RouteName } from './routes';

export { ROUTES };
export type { RouteName };

export function createPageUrl(pageName: RouteName): string;
export function createPageUrl(pageName: string, allowLegacyFallback: true): string;
export function createPageUrl(pageName: string, allowLegacyFallback = false): string {
  if (pageName in ROUTES) {
    return ROUTES[pageName as RouteName];
  }

  if (allowLegacyFallback) {
    return `/${pageName.toLowerCase().replace(/ /g, '-')}`;
  }

  throw new Error(`Unknown route name: ${pageName}`);
}
