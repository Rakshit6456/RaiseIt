// Read-only review of every account, so you can spot anything unexpected
// (extra admins, self-registered users, missing profiles).
//
//   npm run audit:users                 # report only
//   npm run audit:users -- --sync-claims # also write role claims for accounts missing them
import { init, parseArgs, listAllAuthUsers, claimsFromProfile, ROLES } from "./_admin.mjs";

const { "sync-claims": syncClaims } = parseArgs();
const { auth, db, projectId } = init();
console.log(`Firebase project: ${projectId}\n`);

const authUsers = await listAllAuthUsers(auth);
const profiles = new Map((await db.collection("users").get()).docs.map((d) => [d.id, d.data()]));

const rows = [];
const problems = [];
for (const user of authUsers) {
    const profile = profiles.get(user.uid);
    const claims = user.customClaims || {};
    const row = {
        email: user.email,
        role: profile?.role ?? "(no profile)",
        dept: profile?.department ?? "",
        active: profile ? profile.active !== false : "",
        authDisabled: user.disabled,
        claimRole: claims.role ?? "",
        createdBy: profile?.createdBy ? "admin" : profile?.seededByScript ? "script" : "self/other",
        created: user.metadata.creationTime?.slice(0, 16),
        lastSignIn: user.metadata.lastSignInTime?.slice(0, 16) ?? "never",
    };
    rows.push(row);

    if (!profile) problems.push(`${user.email}: Auth account has no Firestore profile`);
    else if (!ROLES.includes(profile.role)) problems.push(`${user.email}: invalid role "${profile.role}"`);
    else if (profile.role === "department" && !profile.department) problems.push(`${user.email}: department account without a department`);
    if (profile?.role === "admin") problems.push(`${user.email}: ADMIN - confirm this is expected`);
    if (profile && row.createdBy === "self/other" && profile.role !== "student") problems.push(`${user.email}: ${profile.role} account was not created by an admin or script`);

    if (syncClaims && profile && ROLES.includes(profile.role)) {
        const wanted = claimsFromProfile(profile);
        if (claims.role !== wanted.role || (claims.mustChangePassword === true) !== wanted.mustChangePassword) {
            await auth.setCustomUserClaims(user.uid, wanted);
            console.log(`synced claims for ${user.email}`);
        }
    }
}
for (const [uid, profile] of profiles) {
    if (!authUsers.some((u) => u.uid === uid)) problems.push(`Profile ${uid} (${profile.email}) has no Auth account`);
}

console.table(rows);
console.log(problems.length ? `\nReview:\n${problems.map((p) => `  - ${p}`).join("\n")}` : "\nNo issues found.");
