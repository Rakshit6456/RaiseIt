// Single source of truth for the demo accounts shown on the login page and
// seeded into Firebase via `npm run seed:users:example`. Keep this in sync
// with scripts/users.seed.example.json.
export const DEMO_USERS = [
    {
        role: "student",
        label: "Student",
        name: "Demo Student",
        username: "demo.student",
        email: "demo.student@iilm.edu",
        password: "Student@123",
        studentId: "DEMO-STU-001",
    },
    {
        role: "department",
        label: "Department",
        name: "Demo Department (IT)",
        username: "demo.department",
        email: "demo.department@iilm.edu",
        password: "Department@123",
        department: "IT Department",
    },
    {
        role: "admin",
        label: "Admin",
        name: "Demo Admin",
        username: "demo.admin",
        email: "demo.admin@iilm.edu",
        password: "Admin@123",
    },
]
