import { useAuth } from '@/lib/AuthContext';

export default function RequirePermission({ permission, fallback = null, children }) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return fallback;
  }

  return children;
}
