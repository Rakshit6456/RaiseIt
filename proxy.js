import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { AUTH_POLICY, ROLE_HOME } from "@/lib/auth-policy";

// Route guard. Runs on the server before any protected page is sent, using the
// httpOnly session cookie issued by /api/auth/session. API routes do their own
// (stricter, revocation-checking) verification in lib/server-auth.js.
//
// Route prefix -> roles allowed. /forum is shared by every signed-in role.
const RULES = [
    { prefix: "/admin", roles: ["admin"] },
    { prefix: "/department", roles: ["department"] },
    { prefix: "/student", roles: ["student"] },
    { prefix: "/forum", roles: ["student", "department", "admin"] },
];

function redirectToLogin(request) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = "";
    const response = NextResponse.redirect(url);
    response.cookies.delete(AUTH_POLICY.session.cookieName);
    return response;
}

export async function proxy(request) {
    const { pathname } = request.nextUrl;
    const rule = RULES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
    if (!rule) return NextResponse.next();

    const cookie = request.cookies.get(AUTH_POLICY.session.cookieName)?.value;
    if (!cookie) return redirectToLogin(request);

    let claims;
    try {
        claims = await adminAuth.verifySessionCookie(cookie);
    } catch {
        return redirectToLogin(request);
    }

    // First-login accounts can do nothing until they pick their own password.
    if (claims.mustChangePassword === true) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/change-password";
        url.search = "";
        return NextResponse.redirect(url);
    }

    if (!rule.roles.includes(claims.role)) {
        const home = ROLE_HOME[claims.role];
        if (!home) return redirectToLogin(request);
        const url = request.nextUrl.clone();
        url.pathname = home;
        url.search = "";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/department/:path*", "/student/:path*", "/forum/:path*"],
};
