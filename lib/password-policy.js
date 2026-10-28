const MIN_LENGTH = 10;

// Returns an error message, or null when the password is acceptable.
export function validatePassword(password) {
    const value = String(password || "");
    if (value.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters.`;
    if (value.length > 128) return "Password must be at most 128 characters.";
    if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
        return "Password must include an uppercase letter, a lowercase letter and a number.";
    }
    return null;
}

// Random password for the admin form's "Generate" button (browser or Node).
export function generatePassword(length = 14) {
    const sets = ["abcdefghijkmnpqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!@#$%&*?"];
    const all = sets.join("");
    const bytes = new Uint32Array(length);
    globalThis.crypto.getRandomValues(bytes);
    // One character from each set first, so the policy above is always met.
    const chars = sets.map((set, i) => set[bytes[i] % set.length]);
    for (let i = sets.length; i < length; i++) chars.push(all[bytes[i] % all.length]);
    // Fisher-Yates shuffle using fresh randomness.
    const rand = new Uint32Array(chars.length);
    globalThis.crypto.getRandomValues(rand);
    for (let i = chars.length - 1; i > 0; i--) {
        const j = rand[i] % (i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join("");
}
