import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { validatePassword } from "@/lib/password-policy";
import { AuthError, assertActiveProfile, claimsFromProfile, getProfile } from "@/lib/server-auth";

const MAX_TOKEN_AGE_SECONDS = 5 * 60;

// Changes the caller's password and clears the first-login "must change" flag.
// The client re-authenticates with the current password first, so the ID token
// it sends is fresh proof the caller knows it. The flag lives on the profile and
// can only be cleared here, never by the browser.
export async function POST(request) {
    try {
        const { idToken, newPassword } = await request.json().catch(() => ({}));
        if (!idToken || typeof newPassword !== "string") {
            return NextResponse.json({ message: "Invalid request." }, { status: 400 });
        }

        let decoded;
        try {
            decoded = await adminAuth.verifyIdToken(idToken, true);
        } catch {
            return NextResponse.json({ message: "Session expired. Please sign in again." }, { status: 401 });
        }
        if (Date.now() / 1000 - decoded.auth_time > MAX_TOKEN_AGE_SECONDS) {
            return NextResponse.json({ message: "Please confirm your current password again." }, { status: 401 });
        }

        const profile = await getProfile(decoded.uid);
        assertActiveProfile(profile);

        const policyError = validatePassword(newPassword);
        if (policyError) {
            return NextResponse.json({ message: policyError }, { status: 400 });
        }

        await adminAuth.updateUser(decoded.uid, { password: newPassword });
        await adminDb.collection("users").doc(decoded.uid).update({
            forcePasswordReset: false,
            passwordChangedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        await adminAuth.setCustomUserClaims(
            decoded.uid,
            claimsFromProfile({ ...profile, forcePasswordReset: false })
        );
        // Sign out every other session; the client signs in again with the new password.
        await adminAuth.revokeRefreshTokens(decoded.uid);

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ message: error.message }, { status: error.status });
        }
        console.error("Password change failed:", error);
        return NextResponse.json({ message: "Could not change password. Please try again." }, { status: 500 });
    }
}
