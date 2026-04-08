import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Buffer } from 'buffer'
globalThis.Buffer = Buffer

import App from './App.tsx'
import { StellarWalletProvider } from './context/StellarWalletContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StellarWalletProvider>
      <App />
    </StellarWalletProvider>
  </StrictMode>,
)
