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
| `/login` | Login / Register | Public |
| `/dashboard` | Student Dashboard | Student only |
| `/staff` | Staff Dashboard | Admin / Coordinator only |
| `/clubs` | Browse Clubs | All logged-in users |
| `/events` | Browse Events | All logged-in users |

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

*EduEvent Manager — React Edition · Built for college communities*
