import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { validatePassword, claimsFromProfile } from "./_admin.mjs";

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
        if (role === AUTH_POLICY.roles.admin) {
            throw new Error("Admins are not created here. Use `npm run bootstrap:admin`.");
        }
        if (!Object.values(AUTH_POLICY.roles).includes(role)) {
            throw new Error(`Invalid role for user: ${JSON.stringify(rawUser)}`);
        }

        const email = ensureInstitutionEmail(rawUser?.email);
        if (!isAllowedInstitutionEmail(email)) {
            throw new Error(`Disallowed domain for ${email}. Only @${AUTH_POLICY.allowedEmailDomain} is permitted.`);
        }

        const name = String(rawUser?.name || "").trim();
        const password = String(rawUser?.password || "").trim();
        const passwordError = validatePassword(password);
        if (!name || passwordError) {
            throw new Error(`Invalid name/password for ${email}${passwordError ? `: ${passwordError}` : ""}`);
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
            // Re-provisioning resets the password but never re-enables a disabled account.
            await adminAuth.updateUser(uid, {
                password,
                displayName: name,
            });
            updated += 1;
        }

        const profile = {
            uid,
            name,
            email,
            role,
            studentId: role === AUTH_POLICY.roles.student ? String(rawUser.studentId || "").trim() : null,
            department: role === AUTH_POLICY.roles.department ? String(rawUser.department || "").trim() : null,
            // Seeded accounts always make the user choose their own password first.
            forcePasswordReset: true,
            active: true,
            updatedAt: new Date().toISOString(),
            seededByScript: true,
        };
        await adminAuth.setCustomUserClaims(uid, claimsFromProfile(profile));
        await adminDb.collection("users").doc(uid).set(profile, { merge: true });
    }

    console.log(`Seed complete. Created: ${created}, Updated: ${updated}`);
}

main().catch((error) => {
    console.error("Seed failed:", error.message);
    process.exit(1);
});
