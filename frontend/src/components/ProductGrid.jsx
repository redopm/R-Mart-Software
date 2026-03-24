import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Search, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import useBarcodeScanner from '../hooks/useBarcodeScanner';

const ProductGrid = () => {
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const searchInputRef = useRef(null);
    const { addToCart, saleType } = useCart();

    useEffect(() => {
        fetchProducts();
        
        // Setup keyboard shortcuts
        const handleKeyDown = (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useBarcodeScanner(async (barcode) => {
        try {
            const res = await api.get(`/products/barcode/${barcode}`);
            if (res.data) {
                addToCart(res.data);
            }
        } catch (error) {
            console.warn("Barcode scanned but product not found:", barcode);
        }
    });

    const fetchProducts = async (query = '') => {
        setLoading(true);
        try {
            // Using a try-catch for demo data if API isn't running yet
            const response = await api.get(`/products/?search=${query}`);
            setProducts(response.data);
        } catch (error) {
            console.warn("Backend API not reachable. Using mock data for UI demo.");
            // Scaffold some mock data if API is dead
            setProducts([
                { id: 1, name: "Aashirvaad Atta 5kg", category: "Grocery", retail_price: 240, wholesale_price: 225, stock_qty: 40 },
                { id: 2, name: "Tata Salt 1kg", category: "Grocery", retail_price: 28, wholesale_price: 24, stock_qty: 120 },
                { id: 3, name: "Parle-G Gold", category: "Grocery", retail_price: 10, wholesale_price: 8, stock_qty: 300 },
                { id: 4, name: "Maggi 140g", category: "Grocery", retail_price: 30, wholesale_price: 27, stock_qty: 20 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        // Debounce simplisticly
        setTimeout(() => fetchProducts(query), 300);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
            {/* Search Bar */}
            <div className="p-4 border-b border-orange-100 bg-orange-50/50">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={20} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search products by name or barcode (F1)"
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 shadow-sm"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-orange-500">Loading inventory...</div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                        {products.map(product => {
                            const price = saleType === 'wholesale' ? product.wholesale_price : product.retail_price;
                            const isLowStock = product.stock_qty <= 5;
                            
                            return (
                                <div 
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="group flex flex-col justify-between p-4 border border-orange-100 rounded-xl hover:border-orange-400 hover:shadow-md cursor-pointer transition-all bg-white relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-orange-100 text-orange-600 rounded-full p-1">
                                            <Plus size={16} />
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-1 rounded-md mb-2 inline-block">
                                            {product.category}
                                        </span>
                                        <h3 className="font-semibold text-gray-800 leading-tight mb-1">{product.name}</h3>
                                        <p className="text-xs text-gray-500 mb-3">ID: {product.id} {product.barcode ? `| BC: ${product.barcode}` : ''}</p>
                                    </div>
                                    
                                    <div className="flex justify-between items-end mt-2">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-bold text-gray-900">₹{price}</span>
                                        </div>
                                        <div className={`text-xs font-medium px-2 py-1 rounded-md ${isLowStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                            {product.stock_qty} in stock
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {products.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-500 flex flex-col items-center">
                                <Search size={48} className="text-gray-300 mb-4" />
                                <p>No products found matching "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductGrid;
