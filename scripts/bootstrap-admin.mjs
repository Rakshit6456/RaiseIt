// Creates (or resets) the first admin account. Admins cannot be created from the
// web app, by design. Pass the password through the environment so it does not
// land in your shell history:
//
//   ADMIN_PASSWORD='...' npm run bootstrap:admin -- --email you@iilm.edu --name "Your Name"
//
// Add --temporary to accept a password that is below the app's password policy:
// the account is then flagged so the admin must choose a compliant one at first login.
import { init, parseArgs, validatePassword, claimsFromProfile, DOMAIN } from "./_admin.mjs";

const args = parseArgs();
const email = String(args.email || "").trim().toLowerCase();
const name = String(args.name || "").trim();
const password = process.env.ADMIN_PASSWORD || "";

if (!email.endsWith(`@${DOMAIN}`) || !name) {
    console.error(`Usage: ADMIN_PASSWORD='...' npm run bootstrap:admin -- --email you@${DOMAIN} --name "Your Name"`);
    process.exit(1);
}
const temporary = Boolean(args.temporary);
const passwordError = temporary ? (password.length >= 8 ? null : "Even a temporary password needs 8+ characters.") : validatePassword(password);
if (passwordError) {
    console.error(passwordError);
    process.exit(1);
}

const { auth, db, projectId } = init();
console.log(`Firebase project: ${projectId}`);

let user;
try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password, displayName: name, disabled: false, emailVerified: true });
    console.log(`Existing account found; password reset for ${email}.`);
} catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
    user = await auth.createUser({ email, password, displayName: name, disabled: false, emailVerified: true });
    console.log(`Created account for ${email}.`);
}

const now = new Date().toISOString();
const profile = {
    uid: user.uid,
    name,
    email,
    role: "admin",
    studentId: null,
    department: null,
    // A temporary password must be replaced at first login.
    forcePasswordReset: temporary,
    active: true,
    updatedAt: now,
};
await db.collection("users").doc(user.uid).set({ ...profile, createdAt: now }, { merge: true });
await auth.setCustomUserClaims(user.uid, claimsFromProfile(profile));
await auth.revokeRefreshTokens(user.uid);
console.log(`Admin ready. Sign in at /auth/login${temporary ? " (you will be asked to set a new password)" : ""}.`);
