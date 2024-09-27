import 'bootstrap/dist/css/bootstrap.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 {
  defaultOptions: {
    queries: {
      retry: 3,
      cacheTime: 300_000, // 5 min, inactive, removed from cache and garbage collected.
      staleTime: 10 * 1000, // how long data is considered fresh. After 10 sec, its considered stale data
      // refetchOnWindowFocus: false,
      // refetchOnReconnect: false,
      // refetchOnMount: true 
    }
  }
}
 */
const queryClient = new QueryClient();

ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools/>
    </QueryClientProvider>
    
  </React.StrictMode>
);
