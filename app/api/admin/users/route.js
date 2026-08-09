import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import {
    AUTH_POLICY,
    ensureInstitutionEmail,
    isAllowedInstitutionEmail,
} from "@/lib/auth-policy";

function getBearerToken(request) {
    const header = request.headers.get("authorization") || "";
    if (!header.startsWith("Bearer ")) return null;
    return header.slice(7);
}

export async function POST(request) {
    try {
        const token = getBearerToken(request);
        if (!token) {
            return NextResponse.json({ message: "Missing auth token" }, { status: 401 });
        }

        const decoded = await adminAuth.verifyIdToken(token);
        const callerRef = adminDb.collection("users").doc(decoded.uid);
        const callerDoc = await callerRef.get();
        const callerRole = callerDoc.exists ? callerDoc.data()?.role : null;

        if (callerRole !== AUTH_POLICY.roles.admin) {
            return NextResponse.json({ message: "Admin access required" }, { status: 403 });
        }

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
            createdBy: decoded.uid,
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

        // Return the actual error message to help debug configuration issues
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = error?.code || "server-error";

        return NextResponse.json({ 
            message: "Failed to create user", 
            error: errorMessage,
            code: errorCode
        }, { status: 500 });
    }
}
