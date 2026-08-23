# 🎓 EduEvent Manager — React Edition

A full-stack web application for managing college clubs and events.  
**Frontend: React 18 + React Router v6 | Backend: Node.js + Express + MongoDB**

---

## 📁 Project Structure

```
eduevent-manager/
│
├── frontend/                      ← React App
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js                 ← Routes + Layout
│   │   ├── index.js               ← React entry point
│   │   ├── index.css              ← Global styles (glassmorphism theme)
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.js     ← Global auth state (user, token, login, logout)
│   │   │   └── ToastContext.js    ← Global toast notifications
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx         ← Top navigation bar
│   │   │   └── ProtectedRoute.jsx ← Route guard (auth + role check)
│   │   │
│   │   ├── pages/
│   │   │   ├── Landing.jsx        ← Home / landing page
│   │   │   ├── Login.jsx          ← Login + Register (role-aware)
│   │   │   ├── StudentDashboard.jsx  ← Student dashboard
│   │   │   ├── StaffDashboard.jsx    ← Admin / Coordinator dashboard
│   │   │   ├── Clubs.jsx          ← Browse clubs + register
│   │   │   └── Events.jsx         ← Browse events + register
│   │   │
│   │   └── utils/
│   │       └── api.js             ← All API calls in one place
│   │
│   └── package.json
│
└── backend/                       ← Express API
    ├── server.js
    ├── seed.js
    ├── package.json
    ├── .env.example
    ├── middleware/
    │   └── auth.js                ← JWT protect + role guard
    ├── models/
    │   ├── User.js
    │   ├── Club.js
    │   ├── Event.js
    │   └── Registration.js
    └── routes/
        ├── auth.js
        ├── clubs.js
        ├── events.js
        ├── interests.js
        └── registrations.js
```

---

## ⚙️ Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ | https://nodejs.org |
| MongoDB Compass | Latest | https://mongodb.com/compass |
| npm | v9+ | Included with Node.js |

---

## 🚀 Setup — Step by Step

### Step 1 — Open MongoDB Compass and Connect
- Launch **MongoDB Compass**
- Connection string: `mongodb://localhost:27017`
- Click **Connect** and keep it open

---

### Step 2 — Start the Backend

Open a terminal in VS Code (`Ctrl + \``) and run:

```bash
cd backend
npm install
node seed.js       ← only needed once (creates demo data)
node server.js     ← keep this running
```

You should see:
```
✅ Connected to MongoDB
🚀 Server running at http://localhost:5000
```

---

### Step 3 — Start the React Frontend

Open a **second terminal** (`+` button in VS Code terminal panel):

```bash
cd frontend
npm install        ← only needed once
npm start          ← starts React dev server
```

React will open automatically at: **http://localhost:3000**

---

## 🔑 Demo Login Credentials

| Role | Login ID | Password | Assigned Clubs |
|------|----------|----------|----------------|
| Student | `STU001` | `student123` | — |
| Admin | `ADMIN001` | `admin123` | Code Crafters, Startup Studio |
| Coordinator 1 | `COORD001` | `coord123` | Code Crafters, PixelPlay Gaming |
| Coordinator 2 | `COORD002` | `coord456` | Canvas Collective, Rhythm Nation |

> Click the **Demo** buttons on the login page to auto-fill credentials.

---

## 🗺️ Page Routes

| URL | Page | Access |
|-----|------|--------|
| `/` | Landing page | Public |
<img width="1899" height="920" alt="Screenshot 2026-05-27 191229" src="https://github.com/user-attachments/assets/974f2da9-db97-4bfa-a3e4-a71153cb1241" />
| `/login` | Login / Register | Public |
<img width="1914" height="905" alt="Screenshot 2026-05-27 191320" src="https://github.com/user-attachments/assets/87ac8911-0910-475d-8682-152b6a2f5d8a" />
| `/dashboard` | Student Dashboard | Student only |
<img width="1868" height="902" alt="Screenshot 2026-05-27 191359" src="https://github.com/user-attachments/assets/245a5f28-0f03-48ce-a798-f7b65fe78863" />
| `/staff` | Staff Dashboard | Admin / Coordinator only |
<img width="1884" height="902" alt="Screenshot 2026-05-27 192327" src="https://github.com/user-attachments/assets/94c59aa4-9a3f-47eb-862b-6dad5d9f50fe" />
<img width="1880" height="891" alt="Screenshot 2026-05-27 192347" src="https://github.com/user-attachments/assets/4657b2b9-7fd6-4d5d-96cb-426750237412" />
<img width="1902" height="911" alt="Screenshot 2026-05-27 192444" src="https://github.com/user-attachments/assets/9cb95ad4-c049-4e49-86e7-711f66a371f5" />
<img width="1888" height="903" alt="Screenshot 2026-05-27 192459" src="https://github.com/user-attachments/assets/b2a49c3e-06fd-4c79-9a8b-dfd25f4f1d0c" />
| `/clubs` | Browse Clubs | All logged-in users |
<img width="1884" height="925" alt="Screenshot 2026-05-27 191437" src="https://github.com/user-attachments/assets/c54873aa-1ddc-42b9-93a0-c32544b77a41" />
<img width="1887" height="889" alt="Screenshot 2026-05-27 191500" src="https://github.com/user-attachments/assets/c8f2e5a6-e3f5-4d15-ad24-61b016b32689" />
| `/events` | Browse Events | All logged-in users |
<img width="1907" height="878" alt="Screenshot 2026-05-27 191605" src="https://github.com/user-attachments/assets/ccaf70ab-3cb4-4cc9-ac5b-9ccb358bbd12" />

---

## 🔐 Role-Based Access

| Feature | Student | Coordinator | Admin |
|---------|---------|-------------|-------|
| Browse all clubs | ✅ | ❌ (own clubs only) | ❌ (own clubs only) |
| Register for clubs/events | ✅ | — | — |
| Select interests + recommendations | ✅ | — | — |
| View own request status | ✅ | — | — |
| See requests for their clubs | — | ✅ | ✅ |
| Approve / Reject requests | — | ✅ | ✅ |
| Create events | — | ✅ (own clubs) | ✅ (own clubs) |
| Delete events | — | ✅ (own clubs) | ✅ (own clubs) |
| Create clubs | — | ✅ | ✅ |

---

## 🌐 Backend API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, receive JWT |
| GET  | `/api/auth/clubs-list` | Public clubs list (for signup) |

### Clubs
| Method | Endpoint | Access |
|--------|----------|--------|
| GET    | `/api/clubs` | Any logged-in user |
| POST   | `/api/clubs` | Coordinator / Admin |
| POST   | `/api/clubs/register` | Student |

### Events
| Method | Endpoint | Access |
|--------|----------|--------|
| GET    | `/api/events` | Any logged-in user |
| POST   | `/api/events` | Coordinator / Admin (own clubs) |
| DELETE | `/api/events/:id` | Coordinator / Admin (own clubs) |
| POST   | `/api/events/register` | Student |

### Interests
| Method | Endpoint | Access |
|--------|----------|--------|
| GET    | `/api/interests/my` | Student |
| POST   | `/api/interests/save` | Student |
| GET    | `/api/interests/recommendations` | Student |

### Registrations
| Method | Endpoint | Access |
|--------|----------|--------|
| GET    | `/api/registrations/my` | Student |
| GET    | `/api/registrations/club-requests` | Coordinator / Admin |
| PATCH  | `/api/registrations/:id/status` | Coordinator / Admin (own clubs) |

---

## ⚛️ React Architecture

- **React Router v6** — client-side routing with `<Routes>` and `<Navigate>`
- **Context API** — `AuthContext` for global user state, `ToastContext` for notifications
- **ProtectedRoute** — checks auth + role, redirects automatically
- **Proxy** — `"proxy": "http://localhost:5000"` in `package.json` (no CORS issues)
- **Functional components** — all pages use hooks (`useState`, `useEffect`, `useCallback`)
- **No external UI library** — pure CSS with glassmorphism design system

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, CSS3 |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Fonts | Google Fonts (Playfair Display + DM Sans) |

---

## 📝 Every Time You Start the Project

1. Open **MongoDB Compass** → Connect
2. Terminal 1: `cd backend && node server.js`
3. Terminal 2: `cd frontend && npm start`
4. Browser opens at `http://localhost:3000`

---

---
*EduEvent Manager — React Edition · Built for college communities*
