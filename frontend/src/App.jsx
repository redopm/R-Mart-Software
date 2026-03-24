import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProductGrid from './components/ProductGrid';
import Cart from './components/Cart';
import CheckoutModal from './components/CheckoutModal';
import Login from './components/Login';
import { useCart } from './context/CartContext';
import { useAuth } from './context/AuthContext';

function POSDashboard() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { cartItems } = useCart();

  return (
    <div className="flex flex-col h-screen bg-orange-50 overflow-hidden text-gray-800">
      <Navbar />
      
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 overflow-y-auto">
          <ProductGrid />
        </div>

        <div className="w-[400px] border-l border-orange-200 bg-white flex flex-col shadow-xl">
          <Cart onCheckout={() => setIsCheckoutOpen(true)} />
        </div>
      </main>

      {isCheckoutOpen && (
        <CheckoutModal onClose={() => setIsCheckoutOpen(false)} />
      )}
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-orange-50 text-orange-600 font-bold">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/" 
          element={user ? <POSDashboard /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
