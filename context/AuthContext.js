"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserSessionPersistence,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import {
    AUTH_POLICY,
    ensureInstitutionEmail,
    isAllowedInstitutionEmail,
} from "@/lib/auth-policy";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    function signup(email, password) {
        if (!auth) return Promise.reject(new Error("Firebase not initialized"));
        if (!AUTH_POLICY.allowPublicSignup) {
            return Promise.reject(new Error("Public signup is disabled. Contact admin."));
        }

        const normalizedEmail = ensureInstitutionEmail(email);
        if (!isAllowedInstitutionEmail(normalizedEmail)) {
            return Promise.reject(new Error("Only @iilm.edu accounts are allowed."));
        }

        return createUserWithEmailAndPassword(auth, normalizedEmail, password);
    }

    function login(email, password) {
        if (!auth) return Promise.reject(new Error("Firebase not initialized"));
        const normalizedEmail = ensureInstitutionEmail(email);
        if (!isAllowedInstitutionEmail(normalizedEmail)) {
            return Promise.reject(new Error("Only @iilm.edu accounts can login."));
        }

        return signInWithEmailAndPassword(auth, normalizedEmail, password);
    }

    function logout() {
        if (!auth) return Promise.reject(new Error("Firebase not initialized"));
        return signOut(auth);
    }

    const [userData, setUserData] = useState(null)

    useEffect(() => {
        if (!auth) {
            setLoading(false);  // No Firebase → just show app as guest
            return;
        }

        // Scope the session to this browser tab (sessionStorage) instead of the
        // default localStorage, which is shared across all tabs of the same origin
        // and was causing a sign-in in one tab to hijack every other open tab.
        setPersistence(auth, browserSessionPersistence).catch((err) => {
            console.error("Failed to set auth persistence:", err);
        });

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);

            if (user) {
                // Subscribe to user profile changes
                const userDocRef = doc(db, "users", user.uid)
                const unsubUser = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        setUserData(doc.data())
                    }
                })
                setLoading(false);
                return () => unsubUser()
            } else {
                setUserData(null)
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser: currentUser || (loading ? null : { uid: "guest-user", email: "guest@example.com", isGuest: true }),
        userData: userData || (currentUser ? null : { role: "student", name: "Guest User", isGuest: true }),
        signup,
        login,
        logout,
        loading,
        isGuest: !currentUser && !loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
