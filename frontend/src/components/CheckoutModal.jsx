import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { X, CreditCard, Banknote, BookUser, CheckCircle2, Printer } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const CheckoutModal = ({ onClose }) => {
    const { cartItems, cartTotal, saleType, clearCart } = useCart();
    const { user } = useAuth(); // To print cashier name
    
    // Read from .env file so the store owner can edit it without touching code
    const UPIMerchantID = import.meta.env.VITE_UPI_ID || "9588038150@upi"; 
    const UPIMerchantName = import.meta.env.VITE_UPI_MERCHANT_NAME || "CHHOTASHOP SUPERMART";
    
    // Store details from .env
    const STORE_NAME = import.meta.env.VITE_STORE_NAME || "CHHOTASHOP SUPERMART";
    const STORE_CIN = import.meta.env.VITE_STORE_CIN || "L51900MH2000PLC128473";
    const STORE_GSTIN = import.meta.env.VITE_STORE_GSTIN || "37AACCA8432H1ZP";
    const STORE_FSSAI = import.meta.env.VITE_STORE_FSSAI || "10121004001009";
    const STORE_ADDRESS = import.meta.env.VITE_STORE_ADDRESS || "SHOP NO. 42, MAIN BAZAR ROAD, AZAD CHOWK, CITY CENTER - 400001";
    const STORE_PHONE = import.meta.env.VITE_STORE_PHONE || "022-2475777";

    const [paymentMode, setPaymentMode] = useState('Cash'); // Cash, UPI, Udhaar
    const [discount, setDiscount] = useState(0);
    const [customerPhone, setCustomerPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const finalAmount = cartTotal - Number(discount);

    // Keyboard shortcut to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleCheckout = async () => {
        setIsSubmitting(true);
        setErrorMsg('');
        
        try {
            // Payload based on the Python schema `SaleCreate`
            const payload = {
                sale_type: saleType,
                discount: Number(discount),
                payment_mode: paymentMode,
                items: cartItems.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                }))
            };

            // Only attempt API call if we have a customer for Udhaar
            if (paymentMode === 'Udhaar' && !customerPhone) {
                throw new Error("Customer Phone is required for Udhaar (Credit) sales.");
            }

            // In a real flow, you'd lookup the customer ID based on phone first.
            // For now, if API fails (because backend isn't running), we show a success demo anyway.
            await api.post(`/sales/`, payload);
            
            showSuccess();
            
        } catch (error) {
            // If backend is unreachable, show error — do NOT fake success
            if (paymentMode === 'Udhaar' && !customerPhone) {
                setErrorMsg("Customer Phone required for Udhaar!");
            } else {
                const detail = error.response?.data?.detail || "Backend not reachable. Ensure the server is running!";
                setErrorMsg(detail);
            }
            setIsSubmitting(false);
        }
    };

    const showSuccess = () => {
        setSuccessMsg(`INV-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`);
        // Remove setTimeout to keep bill on screen
    };

    const handlePrintAndClose = () => {
        window.print();
        clearCart();
        onClose();
    };

    const closeWithoutPrinting = () => {
        clearCart();
        onClose();
    };

    if (successMsg) {
        // Calculate Total Quantities and MRP Savings
        const totalItems = cartItems.length;
        const totalQty = cartItems.reduce((acc, item) => acc + item.quantity, 0);
        let totalMrp = 0;
        cartItems.forEach(i => totalMrp += (i.retail_price * i.quantity)); // Assume retail_price is MRP
        const totalSavings = totalMrp - finalAmount;
        
        // Mock Tax Calculation (Assuming 5% GST on everything for simplicity)
        const taxableAmount = finalAmount / 1.05;
        const cgstAmount = (taxableAmount * 0.025);
        const sgstAmount = (taxableAmount * 0.025);

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-2 overflow-y-auto">
                <div className="bg-white rounded shadow-xl w-full max-w-[420px] flex flex-col my-4">
                    
                    {/* Scrollable Receipt Area */}
                    <div id="printable-receipt" className="p-6 text-center bg-white font-mono text-xs text-gray-800 tracking-tight leading-snug overflow-y-auto max-h-[75vh]">
                        {/* HEADER */}
                        <h2 className="text-xl font-bold uppercase mb-1">{STORE_NAME}</h2>
                        <p className="mb-2 uppercase opacity-80">
                            CIN No : {STORE_CIN}<br/>
                            GSTIN : {STORE_GSTIN}<br/>
                            FSSAI No : {STORE_FSSAI}
                        </p>
                        <p className="uppercase border-t border-b border-dashed border-gray-400 py-2 mb-2">
                            {STORE_ADDRESS}<br/>
                            Phone : {STORE_PHONE}
                        </p>
                        
                        <h3 className="text-lg font-bold mb-2">TAX INVOICE</h3>
                        
                        {/* INVOICE & CASHIER DETAILS */}
                        <div className="text-left flex flex-wrap justify-between border-b border-dashed border-gray-400 pb-2 mb-2">
                            <span className="w-1/2">Bill No : {successMsg}</span>
                            <span className="w-1/2 text-right">Bill Dt : {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit'})}</span>
                            <span className="w-full mt-1">Cashier : {user?.username?.toUpperCase() || 'ADMIN'}/250184</span>
                            {customerPhone && <span className="w-full mt-1">Customer Ph: {customerPhone}</span>}
                        </div>

                        {/* ITEMS HEADER */}
                        <div className="flex text-left font-bold border-b border-dashed border-gray-400 mb-2 pb-1">
                            <span className="w-12">HSN</span>
                            <span className="flex-1">Particulars</span>
                            <span className="w-10 text-center">Qty</span>
                            <span className="w-12 text-right">Rate</span>
                            <span className="w-12 text-right">Value</span>
                        </div>

                        {/* ITEMS LIST */}
                        <div className="text-left space-y-2 mb-2 pb-2 border-b border-gray-400">
                            {cartItems.map((item, idx) => {
                                const price = saleType === 'wholesale' ? item.wholesale_price : item.retail_price;
                                const itemTotal = price * item.quantity;
                                // Mock random HSN code based on item id
                                const hsn = `170${item.id}${Math.floor(Math.random()*90)}`;
                                return (
                                    <div key={idx} className="flex flex-col">
                                        <div className="flex w-full mb-0.5 opacity-80 text-[10px]">
                                            <span>CGST@2.5% SGST@2.5%</span>
                                        </div>
                                        <div className="flex w-full uppercase">
                                            <span className="w-12">{hsn}</span>
                                            <span className="flex-1 break-words pr-1">{item.name.slice(0,18)}</span>
                                            <span className="w-10 text-center">{item.quantity}</span>
                                            <span className="w-12 text-right">{price.toFixed(2)}</span>
                                            <span className="w-12 text-right font-medium">{itemTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* SUMMARY */}
                        <div className="flex justify-between items-end border-b-2 border-dashed border-gray-500 pb-2 mb-2 pt-1 font-bold text-sm">
                            <span>Items: {totalItems}</span>
                            <span>Qty: {totalQty}</span>
                            <span>Total INR: {finalAmount.toFixed(2)}</span>
                        </div>

                        {/* GST BREAKUP */}
                        <div className="text-center mb-1">{"<---------- GST Breakup Details --------->"}</div>
                        <div className="w-full text-left text-[10px] mb-2 border-b border-gray-400 pb-2">
                            <div className="flex font-bold justify-between opacity-90 border-b border-dashed border-gray-300 mb-1">
                                <span className="w-10">GST</span>
                                <span className="w-14">Taxable</span>
                                <span className="w-10">CGST</span>
                                <span className="w-10">SGST</span>
                                <span className="w-12 text-right">Amnt</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="w-10">5.0%</span>
                                <span className="w-14">{taxableAmount.toFixed(2)}</span>
                                <span className="w-10">{cgstAmount.toFixed(2)}</span>
                                <span className="w-10">{sgstAmount.toFixed(2)}</span>
                                <span className="w-12 text-right">{finalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* FINAL PAYMENT */}
                        <div className="text-center mb-2">{"<----- Amount Received From Customer ----->"}</div>
                        <div className="flex justify-between text-sm font-bold border-b border-gray-600 pb-2 mb-2">
                            <span>{paymentMode.toUpperCase()} PAYMENT :</span>
                            <span>{finalAmount.toFixed(2)} /-</span>
                        </div>

                        {/* SAVINGS */}
                        {totalSavings > 0 && (
                            <div className="font-bold text-sm bg-gray-100 p-1 mb-4 rounded border border-gray-300">
                                ** Saved Rs. {totalSavings.toFixed(2)}/- On MRP **
                            </div>
                        )}

                        {/* FOOTER & BARCODE */}
                        <p className="mb-3 text-[10px]">This is computer generated invoice</p>
                        <div className="flex justify-center mb-3">
                            <QRCodeSVG 
                                value={JSON.stringify({
                                    store: STORE_NAME,
                                    gstin: STORE_GSTIN,
                                    inv: successMsg,
                                    amt: finalAmount.toFixed(2),
                                    dt: new Date().toISOString(),
                                    mode: paymentMode
                                })} 
                                size={100} 
                                level={"L"} 
                            />
                        </div>
                        <div className="text-left text-[10px] opacity-80 uppercase leading-snug">
                            Transaction Dt/Tm: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-US')}<br/>
                            AUTH CODE: {Math.floor(Math.random() * 9000000) + 1000000}<br/>
                            RRN: 311413{Math.floor(Math.random() * 900000)}<br/>
                            AMOUNT: Rs. {finalAmount.toFixed(2)}/-<br/>
                            NAME: {user?.username?.toUpperCase() || 'POS-1'}
                        </div>
                        
                        <p className="border-t border-dashed border-gray-400 pt-3 mt-3 font-bold text-sm">
                            *** THANK YOU VISIT AGAIN ***
                        </p>
                    </div>

                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3 print:hidden shrink-0">
                        <button 
                            onClick={closeWithoutPrinting}
                            className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded shadow-sm hover:bg-gray-100 transition-colors"
                        >
                            Close
                        </button>
                        <button 
                            onClick={handlePrintAndClose}
                            className="flex-[2] px-4 py-3 bg-[#ea580c] text-white font-bold rounded shadow-sm hover:bg-orange-700 transition-colors flex justify-center items-center gap-2"
                        >
                            <Printer size={20} /> PRINT INVOICE
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-orange-200">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-orange-100 flex justify-between items-center bg-orange-50 shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">Checkout</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-white rounded-full p-1 hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {errorMsg && (
                        <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-100 font-medium">
                            {errorMsg}
                        </div>
                    )}

                    {/* Summary */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                        <div className="flex justify-between mb-2 text-gray-600">
                            <span>Total Amount</span>
                            <span className="font-semibold text-gray-800">₹{cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4 text-orange-600 border-b border-gray-200 pb-4">
                            <span>Discount (₹)</span>
                            <input 
                                type="number" 
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                className="w-24 text-right bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-semibold"
                                min="0"
                            />
                        </div>
                        <div className="flex justify-between text-xl">
                            <span className="font-bold text-gray-800">Amount to Pay</span>
                            <span className="font-extrabold text-orange-600">₹{finalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Payment Mode */}
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Mode</h3>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <button 
                            onClick={() => setPaymentMode('Cash')}
                            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${paymentMode === 'Cash' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 bg-white text-gray-500 hover:border-orange-200'}`}
                        >
                            <Banknote size={24} className="mb-2" />
                            <span className="font-medium text-sm">Cash</span>
                        </button>
                        <button 
                            onClick={() => setPaymentMode('UPI')}
                            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${paymentMode === 'UPI' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 bg-white text-gray-500 hover:border-orange-200'}`}
                        >
                            <CreditCard size={24} className="mb-2" />
                            <span className="font-medium text-sm">UPI</span>
                        </button>
                        <button 
                            onClick={() => setPaymentMode('Udhaar')}
                            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${paymentMode === 'Udhaar' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 bg-white text-gray-500 hover:border-orange-200'}`}
                        >
                            <BookUser size={24} className="mb-2" />
                            <span className="font-medium text-sm">Udhaar</span>
                        </button>
                    </div>

                    {/* Customer Lookup (for Udhaar) */}
                    {paymentMode === 'Udhaar' && (
                        <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Phone Number <span className="text-red-500">*</span></label>
                            <input 
                                type="text"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="Enter 10-digit number"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow bg-gray-50 focus:bg-white"
                            />
                        </div>
                    )}

                    {/* UPI QR Code */}
                    {paymentMode === 'UPI' && (
                        <div className="mb-6 flex flex-col items-center bg-gray-50 p-5 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2">
                            <p className="text-sm font-semibold text-gray-600 mb-3">Scan to Pay via Any UPI App</p>
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-orange-100">
                                <QRCodeSVG 
                                    value={`upi://pay?pa=${UPIMerchantID.toLowerCase()}&pn=${encodeURIComponent(UPIMerchantName)}&am=${finalAmount.toFixed(2)}&cu=INR`} 
                                    size={180}
                                    level={"M"}
                                    fgColor={"#ea580c"}
                                />
                            </div>
                            <p className="mt-4 text-2xl font-black text-orange-600">₹{finalAmount.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-1 tracking-wide">VPA: {UPIMerchantID.toLowerCase()}</p>
                        </div>
                    )}
                </div>

                {/* Sticky Footer for Submit */}
                <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                    <button 
                        onClick={handleCheckout}
                        disabled={isSubmitting}
                        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-bold py-4 rounded-xl shadow-lg transition-all text-lg tracking-wide uppercase"
                    >
                        {isSubmitting 
                            ? 'Processing...' 
                            : paymentMode === 'UPI' 
                                ? 'Payment Done & Generate Bill' 
                                : paymentMode === 'Cash'
                                    ? 'Accept Cash & Generate Bill'
                                    : 'Save Udhaar & Generate Bill'
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;
