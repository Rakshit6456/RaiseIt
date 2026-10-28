import { AUTH_POLICY } from "@/lib/auth-policy";

export const COMPLAINT_CATEGORIES = ["electrical", "plumbing", "infrastructure", "sanitation", "it", "other"];

export const COMPLAINT_AUTHORITIES = AUTH_POLICY.departments;

const CATEGORY_AUTHORITY = Object.freeze({
  electrical: "Electrical Department",
  plumbing: "Plumbing Department",
  infrastructure: "Infrastructure Team",
  sanitation: "Sanitation Team",
  it: "IT Department",
});

export function getAuthorityForCategory(category) {
  const authority = CATEGORY_AUTHORITY[category];
  return COMPLAINT_AUTHORITIES.includes(authority) ? authority : "";
}

export function isComplaintAuthority(authority) {
  return COMPLAINT_AUTHORITIES.includes(authority);
}
