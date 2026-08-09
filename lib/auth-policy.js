export const AUTH_POLICY = {
    allowedEmailDomain: "iilm.edu",
    allowPublicSignup: true,
    allowedSelfSignupRoles: ["student"],
    roles: {
        student: "student",
        department: "department",
        admin: "admin",
    },
};

export function normalizeEmail(input) {
    return String(input || "").trim().toLowerCase();
}

export function ensureInstitutionEmail(input) {
    const email = normalizeEmail(input);
    if (!email) return "";

    if (!email.includes("@")) {
        return `${email}@${AUTH_POLICY.allowedEmailDomain}`;
    }

    return email;
}

export function isAllowedInstitutionEmail(input) {
    const email = normalizeEmail(input);
    return email.endsWith(`@${AUTH_POLICY.allowedEmailDomain}`);
}