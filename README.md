# AI College Timetable & Resource Scheduler

A full-stack intelligent timetable management system that uses a **Constraint Satisfaction Problem (CSP)** engine to automatically generate conflict-free college timetables, allocate rooms, manage event requests, and provide an AI-powered chat assistant.

## 🚀 Features

### 🧠 CSP Timetable Engine
- **Constraint Satisfaction Problem solver** with backtracking search, MRV (Minimum Remaining Values) heuristic, and forward checking
- Enforces hard constraints:
  - No teacher double-booking at the same time slot
  - No room double-booking at the same time slot
  - No batch double-booking at the same time slot
  - Daily break: each batch has at most 5 sessions per day
  - Lab rooms only for lab sessions; classrooms only for theory sessions
  - Room capacity ≥ batch student count
- Supports soft constraints (preferred teacher, room block, morning slots)
- Generates **human-readable constraint explanations** for every scheduled session
- **Alternative timetable generator** with different random seeds
- Post-search **conflict verification** with detailed conflict descriptions

### 👥 Role-Based Dashboards

| Role | Capabilities |
|------|-------------|
| **Student** | View personalized weekly/today timetable, select & lock faculty/section preferences, find free rooms |
| **Faculty** | View personal teaching schedule, submit event/workshop room requests, track request status |
| **Admin** | Run CSP engine, generate alternative timetables, approve/reject event requests, view teacher workload analytics, manage student preference locks, view monthly calendar & conflict reports |

### 🎓 Student Preference System
- Students select preferred faculty and section for each subject
- Preferences are **locked** after submission (one-time)
- Personalized timetable is only visible after locking preferences
- Admins can reset preference locks

### 🏢 Event & Room Management
- Faculty submit event requests with specific room selection
- Smart room ranking by capacity fit, room type, e-board availability, and block
- Admin approval re-checks room availability in real-time
- Free room finder with date/time/block filters

### 🤖 AI Chat Assistant (Gemini)
- Natural language queries about:
  - Today's timetable
  - Free room availability
  - Room details
  - Class/subject/batch schedules
- **Grounded answers** — Gemini extracts intent, backend queries real MongoDB data, then Gemini phrases the answer

### 📊 Analytics & Quality Metrics
- Teacher workload breakdown (theory hours, lab hours, total weekly hours, overload detection)
- Timetable quality metrics (conflict counts, preference satisfaction %)
- Monthly calendar density map
- Room utilization statistics

## 🛠️ Tech Stack

### Backend
- **FastAPI** — Python web framework
- **MongoDB** (via Motor) — NoSQL database
- **CSP Engine** — Custom constraint satisfaction solver
- **Google Gemini API** — AI chat assistant
- **JWT** — Authentication & authorization
- **bcrypt** — Password hashing

### Frontend
- **React 18** — UI framework
- **Vite** — Build tool & dev server
- **Tailwind CSS** — Styling
- **Material UI (MUI)** — Icons & components
- **React Router** — Client-side routing

## 📁 Project Structure

```
FOAI_PROJECT/
├── backend/
│   ├── main.py                    # FastAPI application entrypoint
│   ├── db.py                      # MongoDB connection (Motor)
│   ├── models.py                  # Pydantic data models
│   ├── seed.py                    # Database seeding script
│   ├── populate_schedule.py       # Populate schedule via CSP
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # Environment variables
│   ├── config/
│   │   └── timetable_slots.py     # Centralized slot/time configuration
│   ├── csp/
│   │   ├── engine.py              # CSP solver engine
│   │   └── test_csp.py            # Standalone CSP test script
│   ├── routes/
│   │   ├── auth.py                # JWT auth, preferences, user management
│   │   ├── timetable.py           # Timetable generation & queries
│   │   ├── rooms.py               # Room search & details
│   │   ├── events.py              # Event request creation & listing
│   │   ├── admin.py               # Admin approvals, stats, workload
│   │   └── chat.py                # AI chat endpoint
│   └── services/
│       ├── gemini_client.py       # Gemini API wrapper
│       └── room_allocation.py     # Room ranking logic
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx               # React entry point
        ├── App.jsx                # Router & protected routes
        ├── api.js                 # API client
        ├── context/
        │   ├── AuthContext.jsx    # Authentication state
        │   └── ThemeContext.jsx   # Dark/light theme
        ├── components/
        │   ├── Layout.jsx          # App shell with sidebar
        │   ├── Sidebar.jsx        # Navigation sidebar
        │   ├── TimetableTable.jsx # Weekly timetable grid
        │   ├── ChatWidget.jsx     # AI chat assistant widget
        │   ├── StatCard.jsx       # Dashboard stat card
        │   ├── RoomCard.jsx       # Room display card
        │   ├── StatusBadge.jsx    # Event status badge
        │   ├── MonthGrid.jsx      # Monthly calendar grid
        │   └── EmptyState.jsx     # Empty state placeholder
        └── pages/
            ├── LoginPage.jsx
            ├── student/
            │   ├── StudentHome.jsx      # Personalized timetable
            │   ├── PreferenceForm.jsx   # Faculty/section preferences
            │   └── FreeRoomFinder.jsx   # Free room search
            ├── faculty/
            │   ├── FacultyHome.jsx      # Teaching schedule
            │   ├── EventRequestForm.jsx # Event room request
            │   └── RequestStatus.jsx    # Request tracking
            └── admin/
                ├── AdminOverview.jsx    # Dashboard & CSP controls
                ├── AdminRequests.jsx    # Event approval workflow
                └── AdminCalendar.jsx    # Calendar views
```

## 🚦 Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **MongoDB** (local or Atlas)
- **Google Gemini API key** (for AI chat)

## ⚙️ Setup & Installation

### 1. Backend Setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Edit .env file:
#   GEMINI_API_KEY=your_gemini_api_key
#   MONGO_URI=mongodb://localhost:27017
#   DB_NAME=timetable_db
```

### 2. Seed the Database

```bash
cd backend
python seed.py
```

This populates MongoDB with:
- 6 subjects (Low Code, Theory of Computation, Mobile Computing, Web Programming, Computer Networks, Foundation of AI)
- 24 teachers (4 per subject)
- 24 batches (non-uniform student counts)
- 100+ rooms across 4 blocks (A, B, Techlounge, Ideafactory)
- 3 pending + 1 pre-approved event requests
- 5 demo users (admin, 2 students, 2 faculty)

### 3. Generate the Initial Timetable

```bash
cd backend
python populate_schedule.py
```

Or generate via the admin dashboard after starting the server.

### 4. Start the Backend Server

```bash
cd backend
uvicorn main:app --reload --port 8000
```

API documentation is available at: `http://localhost:8000/docs`

### 5. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@college.edu` | `admin123` |
| **Student (locked prefs)** | `student@college.edu` | `student123` |
| **Student (unlocked prefs)** | `student2@college.edu` | `student123` |
| **Faculty** | `priya.nair@college.edu` | `faculty123` |
| **Faculty** | `deepa.k@college.edu` | `faculty123` |

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register a new user |
| POST | `/auth/login` | Login & get JWT token |
| GET | `/auth/me` | Get current user info |

### Preferences
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/preferences/submit` | Save & lock student preferences |
| GET | `/preferences/my` | Get current user's preferences |
| POST | `/admin/users/{user_id}/reset-preference` | Reset preference lock (admin) |
| GET | `/admin/users` | List all users (admin) |

### Timetable
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/timetable/generate` | Run CSP engine & generate timetable |
| GET | `/timetable/my-timetable` | Personalized weekly timetable |
| GET | `/timetable/my-today` | Personalized today's timetable |
| GET | `/timetable/quality` | Timetable quality & conflict stats |
| GET | `/timetable/today` | Campus-wide today's schedule |
| GET | `/timetable/batch/{batchId}` | Batch weekly timetable |
| GET | `/timetable/all` | Complete schedule |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rooms/free` | Find free rooms by date/time/block |
| GET | `/rooms/suitable` | Find suitable rooms by capacity/type/eboard/block |
| GET | `/rooms/all` | List all rooms |
| GET | `/rooms/{room_id}` | Room details |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/events/request` | Create event request (faculty/admin) |
| GET | `/events/requests` | List event requests (filter by status) |
| GET | `/events/requests/{id}` | Event request details |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/requests/{id}/approve` | Approve event & reserve room |
| POST | `/admin/requests/{id}/reject` | Reject event with reason |
| GET | `/admin/stats` | Dashboard statistics |
| GET | `/admin/workload` | Teacher workload analytics |
| POST | `/admin/timetable/alternative` | Generate alternative timetable |
| GET | `/admin/conflicts` | Detect schedule conflicts |
| GET | `/admin/timetable/month` | Monthly calendar data |

### AI Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Ask the AI assistant a question |

## 🧪 Testing the CSP Engine

```bash
cd backend
python -m csp.test_csp
```

This runs the CSP solver against seeded data and prints the full timetable with conflict verification.

## 🧠 How the CSP Engine Works

1. **Build variables** — one per (batch, session) pair
2. **Pre-filter domains** — remove rooms that fail capacity/type constraints
3. **Backtracking search** with:
   - **MRV heuristic** — pick the variable with fewest remaining legal values
   - **Forward checking** — detect domain wipe-outs early
4. **Soft-constraint ordering** — preferred teacher/room/time tried first
5. **Post-search verification** — re-scan for any conflicts
6. **Enrichment** — add start/end times, duration, and constraint explanations

## 📝 License

This project is for educational/academic purposes.