import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

import { theme, cssVariablesResolver } from '@/styles/theme'
import { AuthProvider } from '@/context/AuthContext'
import { AuthWarning } from '@/components/auth'
import App from './App'

import '@mantine/core/styles.css'
import './styles/global.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 3,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="dark" cssVariablesResolver={cssVariablesResolver}>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <AuthWarning />
          </AuthProvider>
        </BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
)
