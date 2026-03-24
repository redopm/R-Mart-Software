import React from 'react';
import { Store, UserCircle, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { saleType, setSaleType } = useCart();
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-orange-200 px-6 py-3 flex justify-between items-center shadow-sm shrink-0">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2 text-orange-600">
        <Store size={28} />
        <h1 className="text-2xl font-bold tracking-tight">ChhotaShop</h1>
      </div>

      {/* Pricing Toggle (Retail / Wholesale) */}
      <div className="flex bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setSaleType('retail')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            saleType === 'retail' 
              ? 'bg-white text-orange-600 shadow-sm border border-orange-100' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Retail (F2)
        </button>
        <button
          onClick={() => setSaleType('wholesale')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            saleType === 'wholesale' 
              ? 'bg-white text-orange-600 shadow-sm border border-orange-100' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Wholesale (F3)
        </button>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4 text-gray-600">
        <div className="flex flex-col text-right">
          <span className="text-sm font-bold text-gray-800">{user?.username || 'Admin'}</span>
          <span className="text-xs text-green-600 px-2 py-0.5 bg-green-50 rounded-full lowercase tracking-wider border border-green-100">{user?.role || 'cashier'}</span>
        </div>
        <button 
          onClick={logout}
          className="hover:bg-red-50 hover:text-red-500 p-2 rounded-full transition-colors group relative"
        >
          <LogOut size={22} />
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            Logout
          </span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
