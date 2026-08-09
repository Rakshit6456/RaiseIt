import { auth } from "@/lib/firebase";

export async function createUserByAdmin(payload) {
    if (!auth?.currentUser) {
        throw new Error("You must be logged in as admin.");
    }

    const token = await auth.currentUser.getIdToken();
    const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
        // If the server provided a specific error reason, include it in the thrown error
        const detail = data?.error ? `: ${data.error}` : "";
        throw new Error((data?.message || "Failed to create user") + detail);
    }

    return data;
}
