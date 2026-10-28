import "server-only";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { AUTH_POLICY } from "@/lib/auth-policy";

const VALID_ROLES = Object.values(AUTH_POLICY.roles);

export class AuthError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

// Claims mirrored from the Firestore profile. The profile (written only by the
// Admin SDK) is the source of truth; claims exist so Firestore rules and the
// proxy can check the role without an extra read.
export function claimsFromProfile(profile) {
    return {
        role: profile.role,
        mustChangePassword: profile.forcePasswordReset === true,
    };
}

export function claimsMatch(tokenClaims, wanted) {
    return (
        tokenClaims.role === wanted.role &&
        (tokenClaims.mustChangePassword === true) === wanted.mustChangePassword
    );
}

export async function getProfile(uid) {
    const snap = await adminDb.collection("users").doc(uid).get();
    return snap.exists ? snap.data() : null;
}

export function assertActiveProfile(profile) {
    if (!profile) throw new AuthError(403, "No profile found for this account. Contact your administrator.");
    if (!VALID_ROLES.includes(profile.role)) throw new AuthError(403, "Unrecognised role. Contact your administrator.");
    if (profile.active === false) throw new AuthError(403, "This account has been disabled. Contact your administrator.");
}

/**
 * Authenticates an API request from the httpOnly session cookie and returns
 * { uid, role, profile }. Bearer ID tokens are not accepted; only the server-issued
 * cookie is.
 *
 * Revocation and disabled-account checks are always on here: API routes are
 * where data is read and written.
 */
export async function requireUser(request, { roles, allowPasswordChange = false } = {}) {
    let decoded;
    try {
        const cookie = (await cookies()).get(AUTH_POLICY.session.cookieName)?.value;
        if (!cookie) throw new AuthError(401, "Not signed in.");
        decoded = await adminAuth.verifySessionCookie(cookie, true);
    } catch (error) {
        if (error instanceof AuthError) throw error;
        throw new AuthError(401, "Session expired. Please sign in again.");
    }

    const profile = await getProfile(decoded.uid);
    assertActiveProfile(profile);

    // Always trust the profile, never the token, for authorisation decisions.
    const role = profile.role;
    if (!allowPasswordChange && profile.forcePasswordReset === true) {
        throw new AuthError(403, "You must change your password before continuing.");
    }
    if (roles && !roles.includes(role)) {
        throw new AuthError(403, "You do not have permission to do that.");
    }

    return { uid: decoded.uid, email: decoded.email, role, profile, decoded };
}

export function sessionCookieOptions() {
    return {
        name: AUTH_POLICY.session.cookieName,
        maxAge: AUTH_POLICY.session.maxAgeSeconds,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    };
}
