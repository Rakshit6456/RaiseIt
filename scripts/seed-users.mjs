import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const AUTH_POLICY = {
    allowedEmailDomain: "iilm.edu",
    roles: {
        student: "student",
        department: "department",
        admin: "admin",
    },
};

function normalizeEmail(input) {
    return String(input || "").trim().toLowerCase();
}

function ensureInstitutionEmail(input) {
    const email = normalizeEmail(input);
    if (!email) return "";
    if (!email.includes("@")) return `${email}@${AUTH_POLICY.allowedEmailDomain}`;
    return email;
}

function isAllowedInstitutionEmail(input) {
    const email = normalizeEmail(input);
    return email.endsWith(`@${AUTH_POLICY.allowedEmailDomain}`);
}

function getServiceAccountFromEnv() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing in environment.");
    }

    const serviceAccount = JSON.parse(raw);
    if (serviceAccount.private_key?.includes("\\n")) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }
    return serviceAccount;
}

async function main() {
    const fileArg = process.argv[2] || "scripts/users.seed.json";
    const cwd = process.cwd();
    const inputPath = path.isAbsolute(fileArg) ? fileArg : path.join(cwd, fileArg);

    const payload = JSON.parse(await fs.readFile(inputPath, "utf8"));
    const users = Array.isArray(payload?.users) ? payload.users : [];

    if (!users.length) {
        throw new Error("No users found. Provide payload as { users: [...] }.");
    }

    const app = getApps().length
        ? getApps()[0]
        : initializeApp({ credential: cert(getServiceAccountFromEnv()) });

    const adminAuth = getAuth(app);
    const adminDb = getFirestore(app);

    let created = 0;
    let updated = 0;

    for (const rawUser of users) {
        const role = rawUser?.role;
        if (!Object.values(AUTH_POLICY.roles).includes(role)) {
            throw new Error(`Invalid role for user: ${JSON.stringify(rawUser)}`);
        }

        const email = ensureInstitutionEmail(rawUser?.email);
        if (!isAllowedInstitutionEmail(email)) {
            throw new Error(`Disallowed domain for ${email}. Only @${AUTH_POLICY.allowedEmailDomain} is permitted.`);
        }

        const name = String(rawUser?.name || "").trim();
        const password = String(rawUser?.password || "").trim();
        if (!name || password.length < 6) {
            throw new Error(`Invalid name/password for ${email}`);
        }

        let uid;
        try {
            const createdUser = await adminAuth.createUser({
                email,
                password,
                displayName: name,
                emailVerified: true,
                disabled: false,
            });
            uid = createdUser.uid;
            created += 1;
        } catch (error) {
            if (error?.code !== "auth/email-already-exists") {
                throw error;
            }
            const existing = await adminAuth.getUserByEmail(email);
            uid = existing.uid;
            await adminAuth.updateUser(uid, {
                password,
                displayName: name,
                disabled: false,
            });
            updated += 1;
        }

        await adminAuth.setCustomUserClaims(uid, { role });

        await adminDb.collection("users").doc(uid).set(
            {
                uid,
                name,
                email,
                role,
                studentId: role === AUTH_POLICY.roles.student ? String(rawUser.studentId || "").trim() : null,
                department: role === AUTH_POLICY.roles.department ? String(rawUser.department || "").trim() : null,
                forcePasswordReset: rawUser.forcePasswordReset !== false,
                active: true,
                updatedAt: new Date().toISOString(),
                seededByScript: true,
            },
            { merge: true }
        );
    }

    console.log(`Seed complete. Created: ${created}, Updated: ${updated}`);
}

main().catch((error) => {
    console.error("Seed failed:", error.message);
    process.exit(1);
});
