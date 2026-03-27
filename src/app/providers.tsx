'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }))
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            fontSize: '13px',
            borderRadius: '999px',
            padding: '10px 18px',
            background: '#2D2016',
            color: '#fff',
          },
          success: { iconTheme: { primary: '#D85A30', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  )
}
