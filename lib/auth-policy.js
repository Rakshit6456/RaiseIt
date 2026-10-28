export const AUTH_POLICY = {
    allowedEmailDomain: "iilm.edu",
    // Accounts are provisioned by an admin only (see /api/admin/users and scripts/).
    // Self-registration is permanently disabled; there is no signup code path.
    allowPublicSignup: false,
    roles: {
        student: "student",
        department: "department",
        admin: "admin",
    },
    // Roles an admin may create from the dashboard. Admin accounts are only
    // created out-of-band with `npm run bootstrap:admin`.
    adminCreatableRoles: ["student", "department"],
    // The department list is the single source of truth for both the admin
    // account form and the "tag authority" dropdown on the report form.
    departments: [
        "Electrical Department",
        "Plumbing Department",
        "IT Department",
        "Hostel Warden",
        "Infrastructure Team",
        "Sanitation Team",
        "Security Office",
        "Library Administration",
        "Head of Department",
        "College Principal",
    ],
    session: {
        cookieName: "__session",
        maxAgeSeconds: 60 * 60 * 8, // 8 hours
    },
};

export const ROLE_HOME = {
    student: "/student/dashboard",
    department: "/department/dashboard",
    admin: "/admin/dashboard",
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
