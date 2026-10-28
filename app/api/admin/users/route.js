import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import {
    AUTH_POLICY,
    ensureInstitutionEmail,
    isAllowedInstitutionEmail,
} from "@/lib/auth-policy";
import { validatePassword } from "@/lib/password-policy";
import { AuthError, claimsFromProfile, requireUser } from "@/lib/server-auth";

// Admin-only: every account that exists, merged from Firebase Auth (sign-in
// history, disabled flag) and the Firestore profile (role, department). Read via
// the Admin SDK so it does not depend on client-side Firestore rules.
export async function GET(request) {
    try {
        await requireUser(request, { roles: [AUTH_POLICY.roles.admin] });

        const authUsers = [];
        let pageToken;
        do {
            const page = await adminAuth.listUsers(1000, pageToken);
            authUsers.push(...page.users);
            pageToken = page.pageToken;
        } while (pageToken);

        const profiles = new Map((await adminDb.collection("users").get()).docs.map((d) => [d.id, d.data()]));

        const users = authUsers.map((user) => {
            const profile = profiles.get(user.uid);
            return {
                uid: user.uid,
                name: profile?.name || user.displayName || "",
                email: user.email || "",
                role: profile?.role || null,
                department: profile?.department || null,
                studentId: profile?.studentId || null,
                active: profile ? profile.active !== false && !user.disabled : false,
                mustChangePassword: profile?.forcePasswordReset === true,
                hasProfile: Boolean(profile),
                createdAt: user.metadata.creationTime || null,
                lastSignInAt: user.metadata.lastSignInTime || null,
            };
        });
        users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        return NextResponse.json({ users });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ message: error.message }, { status: error.status });
        }
        console.error("Admin user listing failed:", error);
        return NextResponse.json({ message: "Failed to load accounts" }, { status: 500 });
    }
}

// Admin-only account provisioning. This is the only way student and department
// accounts come into existence.
export async function POST(request) {
    try {
        const caller = await requireUser(request, { roles: [AUTH_POLICY.roles.admin] });

        const body = await request.json().catch(() => ({}));
        const role = body?.role;
        const name = String(body?.name || "").trim();
        const password = String(body?.password || "");
        const studentId = body?.studentId ? String(body.studentId).trim() : null;
        const department = body?.department ? String(body.department).trim() : null;

        if (!name || name.length > 100) {
            return NextResponse.json({ message: "A name (up to 100 characters) is required." }, { status: 400 });
        }

        if (!AUTH_POLICY.adminCreatableRoles.includes(role)) {
            return NextResponse.json({ message: "Role must be student or department." }, { status: 400 });
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return NextResponse.json({ message: passwordError }, { status: 400 });
        }

        const email = ensureInstitutionEmail(body?.email);
        if (!isAllowedInstitutionEmail(email)) {
            return NextResponse.json({ message: "Only @iilm.edu email accounts are allowed" }, { status: 400 });
        }

        if (role === AUTH_POLICY.roles.student && !studentId) {
            return NextResponse.json({ message: "studentId is required for student accounts" }, { status: 400 });
        }

        if (role === AUTH_POLICY.roles.department && !AUTH_POLICY.departments.includes(department)) {
            return NextResponse.json({ message: "Choose a valid department for department accounts" }, { status: 400 });
        }

        const now = new Date().toISOString();
        const profile = {
            name,
            email,
            role,
            studentId: role === AUTH_POLICY.roles.student ? studentId : null,
            // Set once here. Nothing in the app can change it afterwards.
            department: role === AUTH_POLICY.roles.department ? department : null,
            // Every admin-created account must pick its own password on first login.
            forcePasswordReset: true,
            active: true,
            createdBy: caller.uid,
            createdAt: now,
            updatedAt: now,
        };

        const createdUser = await adminAuth.createUser({
            email,
            password,
            displayName: name,
            emailVerified: true,
            disabled: false,
        });

        try {
            await adminAuth.setCustomUserClaims(createdUser.uid, claimsFromProfile(profile));
            await adminDb.collection("users").doc(createdUser.uid).set({ uid: createdUser.uid, ...profile });
        } catch (error) {
            // Don't leave a login without a profile behind.
            await adminAuth.deleteUser(createdUser.uid).catch(() => {});
            throw error;
        }

        return NextResponse.json({
            success: true,
            uid: createdUser.uid,
            email,
            role,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ message: error.message }, { status: error.status });
        }
        if (error?.code === "auth/email-already-exists") {
            return NextResponse.json({ message: "Email already exists" }, { status: 409 });
        }

        console.error("Admin user creation failed:", error);
        return NextResponse.json({ message: "Failed to create user" }, { status: 500 });
    }
}
