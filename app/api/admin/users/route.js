import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { authenticateApiRequest } from "@/lib/api-auth";
import {
    AUTH_POLICY,
    ensureInstitutionEmail,
    isAllowedInstitutionEmail,
} from "@/lib/auth-policy";

export async function POST(request) {
    try {
        const auth = await authenticateApiRequest(request, [AUTH_POLICY.roles.admin]);
        if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

        const body = await request.json();
        const role = body?.role;
        const name = String(body?.name || "").trim();
        const password = String(body?.password || "").trim();
        const studentId = body?.studentId ? String(body.studentId).trim() : null;
        const department = body?.department ? String(body.department).trim() : null;
        const forcePasswordReset = body?.forcePasswordReset !== false;

        if (!name || !password || !role || !Object.values(AUTH_POLICY.roles).includes(role)) {
            return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 });
        }

        const email = ensureInstitutionEmail(body?.email);
        if (!isAllowedInstitutionEmail(email)) {
            return NextResponse.json({ message: "Only @iilm.edu email accounts are allowed" }, { status: 400 });
        }

        if (role === AUTH_POLICY.roles.student && !studentId) {
            return NextResponse.json({ message: "studentId is required for student accounts" }, { status: 400 });
        }

        if (role === AUTH_POLICY.roles.department && !department) {
            return NextResponse.json({ message: "department is required for department accounts" }, { status: 400 });
        }

        const createdUser = await adminAuth.createUser({
            email,
            password,
            displayName: name,
            emailVerified: true,
            disabled: false,
        });

        await adminAuth.setCustomUserClaims(createdUser.uid, { role });

        await adminDb.collection("users").doc(createdUser.uid).set({
            uid: createdUser.uid,
            name,
            email,
            role,
            studentId: role === AUTH_POLICY.roles.student ? studentId : null,
            department: role === AUTH_POLICY.roles.department ? department : null,
            forcePasswordReset,
            active: true,
            createdBy: auth.user.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            uid: createdUser.uid,
            email,
            role,
        });
    } catch (error) {
        console.error("Admin user creation failed:", error);

        if (error?.code === "auth/email-already-exists") {
            return NextResponse.json({ message: "Email already exists" }, { status: 409 });
        }

        const errorCode = error?.code || "server-error";
        console.error("Admin user creation failed.", errorCode);

        return NextResponse.json({ 
            message: "Failed to create user", 
            code: errorCode
        }, { status: 500 });
    }
}
