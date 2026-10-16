import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { WebsiteProvider } from './store'
import ErrorBoundary from './ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <WebsiteProvider>
        <App />
      </WebsiteProvider>
    </ErrorBoundary>
  </StrictMode>,
)
