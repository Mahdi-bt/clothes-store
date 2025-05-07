import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './i18n'; // Import i18n configuration
import AppRoutes from  './routes'
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
