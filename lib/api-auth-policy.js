export function resolveApiRole(decodedToken, profile) {
  if (!profile?.role) return null;
  const claimedRole = decodedToken?.role;
  if (profile.role === "admin" && claimedRole !== "admin") return null;
  if (claimedRole && claimedRole !== profile.role) return null;
  return profile.role;
}
