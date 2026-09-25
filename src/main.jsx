import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './context/AuthContext'
import { ProductProvider } from './context/ProductContext'
import { CartProvider } from './context/CartContext'
import './index.css'
import App from './App.jsx'

// Captura de errores global en consola (evita saturar cuotas de Firestore)
window.onerror = (message, url, line, col, error) => {
  console.error('[Global Error]', message, 'at', url, line + ':' + col, error);
  return false;
};

window.onunhandledrejection = (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <ProductProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </ProductProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
