import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { WagmiConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wagmi'

import './index.css'
import './app.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <App />
      </WagmiConfig>
    </QueryClientProvider>
  </React.StrictMode>
)
