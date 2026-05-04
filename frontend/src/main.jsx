// main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import { router } from './routes/routes'
import './styles/index.css'

// ── Hydrate dark mode BEFORE React renders ────────────────────────────────────
// Must run synchronously here, not inside a component, to avoid a white flash.
import usePreferencesStore from './store/usePreferencesStore'
usePreferencesStore.getState().hydrate()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)