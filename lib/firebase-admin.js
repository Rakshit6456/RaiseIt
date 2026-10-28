import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let serviceAccount = null;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        if (serviceAccount?.private_key && serviceAccount.private_key.includes("\\n")) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
        }
    }
} catch {
    console.error("Firebase Admin service account configuration could not be parsed.");
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
