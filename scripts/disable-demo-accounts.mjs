// Locks out the old public demo accounts: disables them, replaces their
// password with a random one nobody knows, and revokes their sessions.
// Their complaints, comments and votes are left untouched.
//
//   npm run disable:demo                      # dry run, lists what would change
//   npm run disable:demo -- --apply           # disable them
//   npm run disable:demo -- --apply --delete  # delete the Auth accounts and profiles instead
import crypto from "node:crypto";
import { init, parseArgs } from "./_admin.mjs";

const DEMO_EMAILS = [
    "demo.student@iilm.edu",
    "demo.department@iilm.edu",
    "demo.admin@iilm.edu",
];

const { apply, delete: remove } = parseArgs();
const { auth, db, projectId } = init();
console.log(`Firebase project: ${projectId} (${apply ? (remove ? "APPLY: DELETE" : "APPLY: disable") : "dry run"})`);

for (const email of DEMO_EMAILS) {
    let user;
    try {
        user = await auth.getUserByEmail(email);
    } catch (error) {
        if (error.code === "auth/user-not-found") {
            console.log(`- ${email}: not found, skipping`);
            continue;
        }
        throw error;
    }
    console.log(`- ${email}: uid=${user.uid} disabled=${user.disabled}`);
    if (!apply) continue;

    if (remove) {
        await auth.deleteUser(user.uid);
        await db.collection("users").doc(user.uid).delete();
        console.log("  -> deleted from Auth and Firestore profile removed");
        continue;
    }

    await auth.updateUser(user.uid, {
        disabled: true,
        password: crypto.randomBytes(24).toString("base64url") + "aA1",
    });
    await auth.revokeRefreshTokens(user.uid);
    await db.collection("users").doc(user.uid).set(
        { active: false, disabledReason: "public demo account retired", updatedAt: new Date().toISOString() },
        { merge: true }
    );
    console.log("  -> disabled, password randomised, sessions revoked");
}
if (!apply) console.log("\nNothing changed. Re-run with --apply to lock these accounts.");
