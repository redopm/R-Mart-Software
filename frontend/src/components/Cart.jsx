import React from 'react';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Cart = ({ onCheckout }) => {
    const { 
        cartItems, 
        removeFromCart, 
        updateQuantity, 
        clearCart, 
        cartTotal,
        saleType 
    } = useCart();

    if (cartItems.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-orange-200 p-8 h-full bg-white">
                <ShoppingCart size={64} className="mb-4 text-orange-100" />
                <p className="text-xl font-medium text-orange-400">Cart is empty</p>
                <p className="text-sm text-orange-300 mt-2 text-center">Scan items or click products to add them to the bill.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full h-screen">
            {/* Header */}
            <div className="p-4 border-b border-orange-100 bg-orange-50 flex justify-between items-center shrink-0">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <ShoppingCart size={20} className="text-orange-500" />
                    Current Bill
                    <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                        {cartItems.length} items
                    </span>
                </h2>
                <button 
                    onClick={clearCart}
                    className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors hover:bg-red-50 px-2 py-1 rounded"
                >
                    Clear All
                </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cartItems.map(item => {
                    const price = saleType === 'wholesale' ? item.wholesale_price : item.retail_price;
                    const itemTotal = price * item.quantity;

                    return (
                        <div key={item.product_id} className="flex flex-col p-3 border border-orange-100 rounded-lg hover:border-orange-300 transition-colors bg-white shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-800 max-w-[70%] leading-tight text-sm">{item.name}</h4>
                                <button 
                                    onClick={() => removeFromCart(item.product_id)}
                                    className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <div className="flex justify-between items-center mt-1">
                                <div className="flex items-center gap-2 bg-gray-50 rounded-md border border-gray-100 p-0.5">
                                    <button 
                                        onClick={() => updateQuantity(item.product_id, -1)}
                                        className="p-1 hover:bg-white rounded hover:shadow-sm text-gray-600 transition-all font-bold"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                                    <button 
                                        onClick={() => updateQuantity(item.product_id, 1)}
                                        className="p-1 hover:bg-white rounded hover:shadow-sm text-gray-600 transition-all font-bold"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 mb-0.5">{item.quantity} × ₹{price}</div>
                                    <div className="font-bold text-gray-900 leading-none">₹{itemTotal.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary & Checkout Button */}
            <div className="p-4 border-t border-orange-200 bg-orange-50 shrink-0">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600 font-medium">Grand Total</span>
                    <span className="text-3xl font-extrabold text-orange-600">₹{cartTotal.toFixed(2)}</span>
                </div>
                
                <button 
                    onClick={onCheckout}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-[0_4px_12px_rgba(234,88,12,0.3)] transition-all flex justify-center items-center gap-2 text-lg uppercase tracking-wider"
                >
                    Checkout (F8)
                </button>
            </div>
        </div>
    );
};

export default Cart;
