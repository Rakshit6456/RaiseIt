import { initializeApp, cert, getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// To use this, you'll need to:
// 1. Install firebase-admin: npm install firebase-admin
// 2. Add FIREBASE_SERVICE_ACCOUNT_KEY to your .env.local

let serviceAccount = null;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        console.log("Firebase Admin Debug - Loaded Private Key length:", serviceAccount?.private_key?.length);
        console.log("Firebase Admin Debug - Private Key starts with:", serviceAccount?.private_key?.substring(0, 30));
        console.log("Firebase Admin Debug - Does key contain literal newline? ", serviceAccount?.private_key?.includes("\\n") ? "NO (contains escaped \\\\n)" : "YES (contains real \\n)");
        
        // Fix the key if it still contains escaped \\n instead of real \n
        if (serviceAccount?.private_key && serviceAccount.private_key.includes("\\n")) {
            console.log("Firebase Admin Debug - Fixing escaped newlines in private key...");
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
        }
    }
} catch (e) {
    console.error("Firebase Admin Error parsing service account:", e.message);
}

const adminConfig = serviceAccount ? {
    credential: cert(serviceAccount),
} : {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(adminConfig);
const adminDb = getFirestore(app);
const adminAuth = getAuth(app);

export { adminDb, adminAuth };
