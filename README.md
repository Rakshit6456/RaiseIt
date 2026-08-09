# RaiseIt

RaiseIt is a campus complaint management platform built for IILM University. Students report infrastructure issues (electrical, plumbing, IT, sanitation, and more), departments resolve what's tagged to them, and admins get full oversight — with AI verification, duplicate-aware severity escalation, and a community forum layered on top.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Demo Credentials](#-demo-credentials)
- [Project Structure](#-project-structure)

## ✨ Features

- **3-Role Access Control**: dedicated dashboards and portals for Students, Departments, and Admins.
- **Secure Authentication**: institution-only (`@iilm.edu`) sign-in via Firebase Authentication, with admin-controlled account provisioning.
- **AI Image Verification**: every uploaded photo is checked by Gemini to confirm it actually depicts the reported issue before the complaint is accepted.
- **Duplicate Detection & Severity Escalation**: similar reports from the same category/building are automatically merged into one complaint instead of creating clutter, escalating its severity (Low → Medium → High → Critical) with each new match.
- **Fair-Use Daily Limit**: each student can submit up to 5 complaints per day to keep the queue meaningful.
- **Community Forum**: students browse, upvote, and comment on reported issues; hot/new/top sorting and category/authority filters.
- **Tag-the-Authority Routing**: reporters can tag the responsible department directly on submission.
- **Real-time Tracking & Dashboards**: live status updates (Pending → In Progress → Resolved) and visual analytics via Recharts.
- **Cloudinary Image Uploads**: complaint photos are hosted on Cloudinary.
- **Feedback System**: closes the loop with user feedback once a complaint is resolved.
- **Demo Credentials**: one-click, pre-seeded Student/Department/Admin accounts for instant preview from the login page.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: JavaScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend/Auth**: [Firebase](https://firebase.google.com/) (Auth + Firestore, client & admin SDKs)
- **Image Hosting**: [Cloudinary](https://cloudinary.com/)
- **AI Verification**: [Google Gemini API](https://ai.google.dev/) (image-to-description matching)
- **UI Components**: Radix UI primitives
- **Charts**: Recharts

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RaiseIT
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Environment Variables**
   Create a `.env.local` file in the root directory (see [Environment Variables](#-environment-variables) below).

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔑 Environment Variables

```env
# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (required for secure account provisioning / seed scripts)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"..."}

# Cloudinary (complaint photo storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Gemini (AI image verification — optional; skipped if unset)
GEMINI_API_KEY=your_gemini_api_key
```

## 🔐 Permanent Firebase Authentication Setup (IILM)

Follow these steps to enforce institution-only authentication and admin-controlled account creation.

1. **Enable Firebase Email/Password Auth**
    - Go to Firebase Console → Authentication → Sign-in method.
    - Enable **Email/Password**.

2. **Use IILM-only emails**
    - This project enforces `@iilm.edu` in code for student/admin/department login and account provisioning (`lib/auth-policy.js`).
    - Non-`@iilm.edu` emails are rejected.

3. **Disable public signup for production**
    - Toggle `allowPublicSignup` in `lib/auth-policy.js`.
    - Users can otherwise be created by an admin via the secure API or seed script.

4. **Create first admin account (bootstrap)**
    - In Firebase Console → Authentication → Users, create your first admin manually (must be `@iilm.edu`).
    - In Firestore, create `users/{uid}` with:
       - `role: "admin"`
       - `name`, `email`, `active: true`

5. **Create accounts as admin (students/department/admin)**
    - Use API endpoint `POST /api/admin/users` with admin Firebase ID token in `Authorization: Bearer <token>`.
    - Payload example:
    ```json
    {
       "name": "Rahul Sharma",
       "email": "2023csb101@iilm.edu",
       "password": "Student@123",
       "role": "student",
       "studentId": "2023CSB101",
       "forcePasswordReset": true
    }
    ```

6. **Pre-create accounts in bulk (recommended for launch)**
    - Copy `scripts/users.seed.example.json` to `scripts/users.seed.json`, or point the script at any custom file.
    - Add all student, department, and admin entries.
    - Run:
    ```bash
    npm run seed:users
    ```

7. **Apply Firestore Security Rules (must-do)**
    - Enforce role-based writes from client.
    - Recommended baseline:
    ```javascript
    rules_version = '2';
    service cloud.firestore {
       match /databases/{database}/documents {
          function isSignedIn() { return request.auth != null; }
          function isAdmin() {
             return isSignedIn() &&
                get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
          }
          function isDepartment() {
             return isSignedIn() &&
                get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'department';
          }

          match /users/{userId} {
             allow read: if isSignedIn() && request.auth.uid == userId || isAdmin();
             allow create: if isAdmin();
             allow update: if isAdmin() || request.auth.uid == userId;
             allow delete: if isAdmin();
          }

          match /complaints/{complaintId} {
             allow read: if isSignedIn();
             allow create: if isSignedIn();
             allow update: if isAdmin() || isDepartment();
             allow delete: if isAdmin();
          }

          match /complaintSubmissions/{submissionId} {
             allow read: if isAdmin();
             allow create: if isSignedIn();
          }
       }
    }
    ```

8. **Optional hardening**
    - Turn off or remove the public register page in production.
    - Force password reset on first login (using the `forcePasswordReset` flag in profile + UI flow).
    - Add audit logs for admin account creation.

## 🧪 Demo Credentials

For quick previewing, `scripts/users.seed.example.json` (source of truth: `lib/demo-credentials.js`) defines one pre-seeded account per role. Seed them into Firebase with:

```bash
npm run seed:users:example
```

| Role | Email | Password |
|---|---|---|
| Student | `demo.student@iilm.edu` | `Student@123` |
| Department (IT) | `demo.department@iilm.edu` | `Department@123` |
| Admin | `demo.admin@iilm.edu` | `Admin@123` |

These are also shown in a "Demo Credentials" box on the [login page](/auth/login) — click any row to autofill the sign-in form. Swap or remove them before pointing the app at a production Firebase project.

## 📂 Project Structure

```
RaiseIT/
├── app/                       # Next.js App Router pages and layouts
│   ├── admin/                 # Admin dashboard, browse, issues, accounts, stats, resolved
│   ├── department/            # Department dashboard, forum, issues, profile
│   ├── student/               # Student dashboard, report, track, forum
│   ├── forum/[id]/            # Public complaint thread view
│   ├── auth/                  # Login, department-login, register
│   ├── api/complaints/        # Complaint submission (AI check, dedupe, rate limit, upload)
│   ├── api/admin/users/       # Admin-only account provisioning
│   └── features/, page.js     # Marketing/features & landing pages
├── components/
│   ├── dashboard/             # Stats, charts, recent activity/complaints
│   ├── forms/                 # Login, register, report-issue, demo credentials
│   ├── forum/                 # Forum thread card
│   ├── layout/                # Shell, navbar, sidebar
│   └── ui/                    # Radix-based primitives
├── context/                   # AuthContext, ComplaintContext (global state)
├── lib/                       # firebase, firebase-admin, cloudinary, auth-policy, demo-credentials
├── scripts/                   # seed-users.mjs + seed JSON payloads
└── public/                    # Static assets
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
