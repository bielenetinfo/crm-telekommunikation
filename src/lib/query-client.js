import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

const isRetryableError = (error) => {
  const status = error?.status || error?.response?.status;

  if (!status) return true;
  return status >= 500 || status === 429;
};

const retry = (failureCount, error) => isRetryableError(error) && failureCount < 2;
const retryDelay = (attempt) => Math.min(1000 * 2 ** attempt, 5000);

const logQueryError = (error, query) => {
  console.error('[query-client] Query error', { queryKey: query?.queryKey, message: error?.message });
};

const logMutationError = (error, _variables, _context, mutation) => {
  console.error('[query-client] Mutation error', { mutationKey: mutation?.options?.mutationKey, message: error?.message });
};

export const queryClientInstance = new QueryClient({
  queryCache: new QueryCache({ onError: logQueryError }),
  mutationCache: new MutationCache({ onError: logMutationError }),
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry, retryDelay },
    mutations: { retry },
  },
});
