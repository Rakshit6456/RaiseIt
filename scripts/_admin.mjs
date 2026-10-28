// Shared setup for the local admin scripts. Run them with `npm run <script>`,
// which loads .env via `node --env-file=.env`.
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export const DOMAIN = "iilm.edu";
export const ROLES = ["student", "department", "admin"];

export function init() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing. Run via `npm run <script>` so .env is loaded.");

    const serviceAccount = JSON.parse(raw);
    if (serviceAccount.private_key?.includes("\\n")) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }
    const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
    return { auth: getAuth(app), db: getFirestore(app), projectId: serviceAccount.project_id };
}

export function parseArgs(argv = process.argv.slice(2)) {
    const args = {};
    for (let i = 0; i < argv.length; i++) {
        if (!argv[i].startsWith("--")) continue;
        const key = argv[i].slice(2);
        const next = argv[i + 1];
        if (next === undefined || next.startsWith("--")) args[key] = true;
        else args[key] = argv[++i];
    }
    return args;
}

export function claimsFromProfile(profile) {
    return { role: profile.role, mustChangePassword: profile.forcePasswordReset === true };
}

// Mirrors lib/password-policy.js
export function validatePassword(password) {
    const value = String(password || "");
    if (value.length < 10) return "Password must be at least 10 characters.";
    if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
        return "Password must include an uppercase letter, a lowercase letter and a number.";
    }
    return null;
}

export async function listAllAuthUsers(auth) {
    const users = [];
    let pageToken;
    do {
        const page = await auth.listUsers(1000, pageToken);
        users.push(...page.users);
        pageToken = page.pageToken;
    } while (pageToken);
    return users;
}
