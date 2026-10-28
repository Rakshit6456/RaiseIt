"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import {
    ensureInstitutionEmail,
    isAllowedInstitutionEmail,
} from "@/lib/auth-policy";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

async function postSession(idToken) {
    const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Signs in with Firebase, then exchanges the ID token for the server's
    // httpOnly session cookie. The server decides whether the account may
    // sign in (profile exists, active, valid role) and where it should land.
    async function login(email, password, { expectedRole } = {}) {
        if (!auth) throw new Error("Firebase not initialized");

        const normalizedEmail = ensureInstitutionEmail(email);
        if (!isAllowedInstitutionEmail(normalizedEmail)) {
            throw new Error("Only @iilm.edu accounts can login.");
        }

        const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);

        try {
            let { res, data } = await postSession(await credential.user.getIdToken());
            if (res.status === 409 && data.needsRefresh) {
                // The server just updated this account's claims; retry with a fresh token.
                ({ res, data } = await postSession(await credential.user.getIdToken(true)));
            }
            if (!res.ok) throw new Error(data.message || "Could not sign in. Please try again.");

            if (expectedRole && data.role !== expectedRole) {
                await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
                throw new Error(`This portal is for ${expectedRole} accounts only. Use the correct login.`);
            }
            return data;
        } catch (error) {
            await signOut(auth).catch(() => {});
            throw error;
        }
    }

    const logout = useCallback(async () => {
        // Clear the server session first; the cookie is what the route guards trust.
        await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
        if (auth) await signOut(auth);
    }, []);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        // One browser, one session: the server cookie is shared by every tab, so the
        // Firebase session must be too (the old per-tab setting left new tabs signed
        // in on the server but signed out in the client).
        setPersistence(auth, browserLocalPersistence).catch((err) => {
            console.error("Failed to set auth persistence:", err);
        });

        let unsubUser = null;
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (unsubUser) {
                unsubUser();
                unsubUser = null;
            }
            setCurrentUser(user);

            if (user) {
                // Stay in the loading state until the profile (role, department) has arrived.
                setLoading(true);
                unsubUser = onSnapshot(
                    doc(db, "users", user.uid),
                    (snap) => {
                        setUserData(snap.exists() ? snap.data() : null);
                        setLoading(false);
                    },
                    (error) => {
                        console.error("Profile listener error:", error);
                        setUserData(null);
                        setLoading(false);
                    }
                );
            } else {
                setUserData(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribe();
            if (unsubUser) unsubUser();
        };
    }, []);

    const value = {
        currentUser,
        userData,
        login,
        logout,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
