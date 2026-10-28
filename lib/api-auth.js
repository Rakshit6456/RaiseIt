import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { resolveApiRole } from "@/lib/api-auth-policy";

function getBearerToken(request) {
  const header = request.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

export async function authenticateApiRequest(request, allowedRoles = []) {
  const token = getBearerToken(request);
  if (!token) {
    return { error: { status: 401, message: "Authentication required." } };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    const profile = await adminDb.collection("users").doc(decoded.uid).get();
    const user = profile.exists ? profile.data() : null;

    if (!user || user.active === false || !user.role) {
      return { error: { status: 403, message: "An active RaiseIt account is required." } };
    }

    // Admin status must come from the server-set Firebase custom claim as well
    // as the profile. Firestore profile documents may be client-editable.
    const role = resolveApiRole(decoded, user);
    if (!role) {
      return { error: { status: 403, message: "Your account role has changed. Please sign in again." } };
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      return { error: { status: 403, message: "You are not authorized to perform this action." } };
    }

    return {
      user: {
        uid: decoded.uid,
        email: decoded.email || user.email || "",
        role,
        profile: user,
      },
    };
  } catch {
    return { error: { status: 401, message: "Your session is invalid or has expired. Please sign in again." } };
  }
}
