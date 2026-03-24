import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // Determine display name and role. In a real app with custom claims, 
                // you'd decode currentUser.getIdTokenResult().
                setUser({ 
                    uid: currentUser.uid,
                    email: currentUser.email,
                    username: currentUser.email.split('@')[0], 
                    role: 'admin' // Hardcoded for MVP, should come from DB or Custom Claims
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error) {
            console.error("Firebase Auth Error:", error);
            // Translate Firebase error codes to friendly messages
            let msg = "Invalid email or password.";
            if (error.code === 'auth/user-not-found') msg = "No user found with this email.";
            if (error.code === 'auth/wrong-password') msg = "Incorrect password.";
            if (error.code === 'auth/invalid-email') msg = "Invalid email format.";
            if (error.code === 'auth/network-request-failed') msg = "Network error. Check connection.";
            
            return { success: false, error: msg };
        }
    };

    const logout = async () => {
        await firebaseSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
