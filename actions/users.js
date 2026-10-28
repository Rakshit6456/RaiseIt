export async function createUserByAdmin(payload) {
    // Same-origin request: the browser sends the httpOnly session cookie, which
    // the server accepts only for admins who have entered their security code.
    const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.message || "Failed to create user");
    }

    return data;
}

export async function listUsersByAdmin() {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.message || "Failed to load accounts");
    }
    return data.users;
}
