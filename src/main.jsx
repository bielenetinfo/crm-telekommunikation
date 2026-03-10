import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import { queryClientInstance } from '@/lib/query-client'
import { initMonitoring } from '@/lib/monitoring'

const rootElement = document.getElementById('root');
console.log('[main.jsx] Mounting app to root:', rootElement);
initMonitoring();

ReactDOM.createRoot(rootElement).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClientInstance}>
      <App />
    </QueryClientProvider>
  </ErrorBoundary>
)
