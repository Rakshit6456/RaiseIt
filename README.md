# RaiseIt

RaiseIt is a campus complaint management platform built for IILM University. Students report infrastructure issues (electrical, plumbing, IT, sanitation, and more), departments resolve what's tagged to them, and admins get full oversight — with AI verification, duplicate-aware severity escalation, and a community forum layered on top.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)

## ✨ Features

- **3-Role Access Control**: dedicated dashboards and portals for Students, Departments, and Admins.
- **Secure Authentication**: institution-only (`@iilm.edu`) sign-in via Firebase Authentication. There is no self-registration and no demo login: admins create every account, users must set their own password on first login, and sessions are verified on the server (httpOnly cookie, route guards, role claims).
- **AI Image Verification**: every uploaded photo is checked by Groq vision AI to confirm it actually depicts the reported issue before the complaint is accepted.
- **AI Visual Issue Analysis**: students can request editable, fault-focused suggestions for a photo, including category, severity, affected asset, and a matching existing department. Unclear images are left for manual reporting.
- **AI Work Orders**: admins can generate an editable maintenance work-order draft from a complaint, then review, approve, and assign it.
- **Duplicate Detection & Severity Escalation**: similar reports from the same category/building are automatically merged into one complaint instead of creating clutter, escalating its severity (Low → Medium → High → Critical) with each new match.
- **Fair-Use Daily Limit**: each student can submit up to 5 complaints per day to keep the queue meaningful.
- **Community Forum**: students browse, upvote, and comment on reported issues; hot/new/top sorting and category/authority filters.
- **Tag-the-Authority Routing**: reporters can tag the responsible department directly on submission. Department accounts are locked to the single department an admin assigns.
- **Real-time Tracking & Dashboards**: live status updates (Pending → In Progress → Resolved) and visual analytics via Recharts.
- **Cloudinary Image Uploads**: complaint photos are hosted on Cloudinary.
- **Feedback System**: closes the loop with user feedback once a complaint is resolved.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: JavaScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend/Auth**: [Firebase](https://firebase.google.com/) (Auth + Firestore, client & admin SDKs)
- **Image Hosting**: [Cloudinary](https://cloudinary.com/)
- **AI**: [Groq API](https://console.groq.com/) (Qwen vision, image-to-description matching, visual fault analysis, and reviewed work-order drafts)
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

# Groq (AI analysis and work-order drafts; image verification is skipped if unset)
GROQ_API_KEY=your_groq_api_key

```

## 🔐 Authentication & Account Setup

Sign-in is invite-only. Nobody can register themselves: the register page does not exist, and
Firestore rules stop the browser from creating users or changing roles and departments.

1. **Enable Firebase Email/Password auth** (Console → Authentication → Sign-in method).
2. **Block client-side signups** (Console → Authentication → Settings → User actions → uncheck
   *Enable create (sign-up)*, or enable *Disable user signup* on Identity Platform). Without this,
   anyone with your public API key could create a Firebase account through the REST API.
3. **Create the first admin** (admins cannot be created from the web app):
   ```bash
   ADMIN_PASSWORD='a-Strong-Passw0rd' npm run bootstrap:admin -- --email you@iilm.edu --name "Your Name"
   ```
4. **Create everyone else from the app**: sign in as admin → *Manage Accounts*. Pick *Student* or
   *Department*, set a temporary password (use *Generate*), and share it privately. The user is
   forced to choose their own password on first login. Department accounts are tied to the
   department chosen here and cannot change it.
5. **Bulk-create accounts (optional)**: copy `scripts/users.seed.example.json` to
   `scripts/users.seed.json` (git-ignored), fill it in, then run `npm run seed:users`.
6. **Publish the Firestore rules**: paste `firestore.rules` into Console → Firestore → Rules and
   publish (or `firebase deploy --only firestore:rules`). Rules read the `role` claim that the
   server sets on login, so run `npm run audit:users -- --sync-claims` once so existing accounts
   have it before you publish.

### Maintenance scripts

All scripts load `.env` and need `FIREBASE_SERVICE_ACCOUNT_KEY`.

| Command | What it does |
|---|---|
| `npm run bootstrap:admin -- --email … --name …` | Create or reset an admin (password via `ADMIN_PASSWORD`; `--temporary` forces a password change at first login). |
| `npm run audit:users` | Read-only list of every account, role and anomaly. `-- --sync-claims` also writes missing role claims. |
| `npm run disable:demo` | Dry run for the retired public demo accounts. `-- --apply` disables them; `-- --apply --delete` deletes them. |
| `npm run seed:users` | Bulk-create student/department accounts from `scripts/users.seed.json`. |

### How a request is authorised

- Login: the browser signs in with Firebase, then `POST /api/auth/session` verifies the token,
  the profile (exists, active, valid role) and issues an httpOnly `__session` cookie.
- `proxy.js` checks that cookie on every `/admin`, `/department`, `/student` and `/forum` page and
  redirects by role. API routes re-verify with revocation checks (`lib/server-auth.js`).
- Complaint creation (`/api/complaints`) takes the user's identity from the session, never the form.
- Optional hardening: enable Firebase App Check, and add rate limiting in front of `/api/auth/session`.

## 📂 Project Structure

```
RaiseIT/
├── app/                       # Next.js App Router pages and layouts
│   ├── admin/                 # Admin dashboard, browse, issues, accounts, stats, resolved
│   ├── department/            # Department dashboard, forum, issues, profile
│   ├── student/               # Student dashboard, report, track, forum
│   ├── forum/[id]/            # Public complaint thread view
│   ├── auth/                  # Login, department-login, change-password
│   ├── api/auth/              # Session cookie (login/logout) and password change
│   ├── api/complaints/        # Complaint submission and image analysis
│   ├── api/admin/complaints/  # Admin-reviewed work-order generation and persistence
│   ├── api/admin/users/       # Admin-only account provisioning
│   └── features/, page.js     # Marketing/features & landing pages
├── components/
│   ├── dashboard/             # Stats, charts, recent activity/complaints
│   ├── forms/                 # Login and report-issue forms
│   ├── forum/                 # Forum thread card
│   ├── layout/                # Shell, navbar, sidebar
│   └── ui/                    # Radix-based primitives
├── context/                   # AuthContext, ComplaintContext (global state)
├── lib/                       # firebase, firebase-admin, cloudinary, auth-policy, server-auth, password-policy
├── proxy.js                   # Server-side route guard (session cookie + role)
├── firestore.rules            # Firestore security rules (publish in the console)
├── scripts/                   # bootstrap-admin, audit-users, disable-demo-accounts, seed-users
└── public/                    # Static assets
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
