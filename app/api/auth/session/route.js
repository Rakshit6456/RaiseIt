import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { AUTH_POLICY, ROLE_HOME } from "@/lib/auth-policy";
import {
    AuthError,
    assertActiveProfile,
    claimsFromProfile,
    claimsMatch,
    getProfile,
    sessionCookieOptions,
} from "@/lib/server-auth";

// A session may only be minted from a token issued by a recent sign-in.
const MAX_TOKEN_AGE_SECONDS = 5 * 60;

// POST: exchange a fresh Firebase ID token for an httpOnly session cookie.
export async function POST(request) {
    try {
        const { idToken } = await request.json().catch(() => ({}));
        if (!idToken || typeof idToken !== "string") {
            return NextResponse.json({ message: "Missing token." }, { status: 400 });
        }

        let decoded;
        try {
            decoded = await adminAuth.verifyIdToken(idToken, true);
        } catch {
            return NextResponse.json({ message: "Invalid or expired sign-in. Please try again." }, { status: 401 });
        }

        if (Date.now() / 1000 - decoded.auth_time > MAX_TOKEN_AGE_SECONDS) {
            return NextResponse.json({ message: "Please sign in again." }, { status: 401 });
        }

        const profile = await getProfile(decoded.uid);
        assertActiveProfile(profile);

        // Keep the token claims in step with the profile. When they differ the
        // token in hand is stale, so ask the client to refresh and retry once.
        const wanted = claimsFromProfile(profile);
        if (!claimsMatch(decoded, wanted)) {
            await adminAuth.setCustomUserClaims(decoded.uid, wanted);
            return NextResponse.json({ needsRefresh: true }, { status: 409 });
        }

        const options = sessionCookieOptions();
        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
            expiresIn: options.maxAge * 1000,
        });

        const response = NextResponse.json({
            role: profile.role,
            mustChangePassword: wanted.mustChangePassword,
            redirectTo: wanted.mustChangePassword ? "/auth/change-password" : ROLE_HOME[profile.role],
        });
        response.cookies.set({ ...options, value: sessionCookie });
        return response;
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ message: error.message }, { status: error.status });
        }
        console.error("Session creation failed:", error);
        return NextResponse.json({ message: "Could not sign in. Please try again." }, { status: 500 });
    }
}

// DELETE: sign out. Clears the cookie and revokes the user's refresh tokens.
export async function DELETE(request) {
    const response = NextResponse.json({ success: true });
    const cookie = request.cookies.get(AUTH_POLICY.session.cookieName)?.value;
    response.cookies.set({ ...sessionCookieOptions(), value: "", maxAge: 0 });

    if (cookie) {
        try {
            const decoded = await adminAuth.verifySessionCookie(cookie);
            await adminAuth.revokeRefreshTokens(decoded.uid);
        } catch {
            // Cookie already invalid; nothing to revoke.
        }
    }
    return response;
}
