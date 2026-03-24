import React, { useState } from 'react';
import { Store, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        const result = await login(email, password);
        if (!result.success) {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-orange-50 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-orange-100">
                <div className="bg-orange-500 p-6 text-center">
                    <div className="mx-auto bg-white w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-sm">
                        <Store size={32} className="text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">ChhotaShop POS</h2>
                    <p className="text-orange-100 mt-1">Sign in to start billing</p>
                </div>
                
                <div className="p-8">
                    {error && (
                        <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium text-center border border-red-100">
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-colors"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-colors"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors disabled:bg-orange-400 mt-4 text-lg"
                        >
                            {loading ? 'Authenticating...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
            
            <p className="mt-8 text-sm text-center text-orange-800">
                Firebase Authentication Active <br/>
                <span className="text-xs text-orange-600/70">Create a user in your Firebase console to login.</span>
            </p>
        </div>
    );
};

export default Login;
