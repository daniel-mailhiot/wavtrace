# wavTrace

wavTrace is a full-stack web app for audio review and revision tracking, similar concept to GitHub but designed for team-based audio deliverables instead of software development. A user uploads audio to be reviewed, the reviewer leaves timestamped notes for changes, and the user iterates based on feedback, with differences between iterations tracked using a version history pinned to the notes and feedback from each version.


## Planned Features 
(attach photos when I'm done)

**Versioning** - Tracks the full history of an audio project across iterations, cleanly logging who said what, when, and on which version so changes and feedback are easy to follow over time.

**User accounts** - Authentication with role-based permissions (owner, reviewer, view-only).

**Pin and region markers** - Reviewers can pin feedback to a specific timestamp or highlight a section of the track, making it clear exactly what each note is referring to.

**Waveform visualization** - Visual waveform display on the timeline.

**Metadata** - Displays audio metadata: loudness (LUFS, true peak, LRA), file specs (sample rate, bit depth, duration, format, bitrate), and clipping detection.

**Auto-detected version diff** - Shows changes between versions (loudness, dynamics, duration, file specs, clipping).

**Project search** - Search across projects by name.

**Approval** - Mark a version as "approved" or "final." Locks it from further comments and visually flags it in the version history.


## Getting Started (local setup)

### Prerequisites
- Node.js (v20 or newer)
- A MongoDB Atlas connection string

### 1. Clone and install

Since this is a monorepo, the `frontend` and `backend` each have their own dependencies.

After cloning the repo:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Backend environment

Create a `.env` file in the `backend` folder:

```bash
MONGO_URI=your-atlas-connection-string
SESSION_SECRET=any-long-random-string
PORT=5000
```

Optional: If you want to run the Newman API tests (see below), also add `MONGO_URI_TEST` (same connection string, but with `wavtrace_test` as the database name in the path).

### 3. Run the app

Two terminals:

```bash
# Terminal 1 - backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 - frontend (http://localhost:5173)
cd frontend
npm run dev
```

Open frontend URL shown in the terminal (`http://localhost:5173`) to use the app.


## Testing

### API tests (Postman/Newman)

An API suite covering auth and project routes, including role-based permission rules. Test data is created and stored in a separate `wavtrace_test` database so the real db doesn't get polluted with dummy data.

#### Coverage
14 requests, 24 assertions:

- **Auth** - register, login, logout, and the session check (`/me`)
- **Projects** - create, list, view, rename, and add members
- **Permissions** - owner-only actions enforced by middleware
- **Negative cases** - 401 (not logged in), 403 (wrong role), 409 (duplicate email)

#### Passing run in Postman (24/24)
![Postman Collection Runner results — 24 tests passing, 0 errors](docs/postman-run-summary.png)


#### Running it in Newman CLI (optional)
Two terminals from the `backend` folder:

```bash
# Terminal 1 - server on the test database
npm run dev:test

# Terminal 2 - run the suite
npm run test:api
```

Requires a `MONGO_URI_TEST` value in `backend/.env`: the same Atlas connection string as `MONGO_URI`, but with `wavtrace_test` as the database name in the path.

#### A passing run will look like:

```
┌─────────────────────────┬──────────┬──────────┐
│                         │ executed │   failed │
├─────────────────────────┼──────────┼──────────┤
│              iterations │        1 │        0 │
│                requests │       14 │        0 │
│            test-scripts │       28 │        0 │
│      prerequest-scripts │       14 │        0 │
│              assertions │       24 │        0 │
└─────────────────────────┴──────────┴──────────┘
```


### Unit tests (Mocha/Chai)
*Not completed yet*
- Mostly for the version diff feature since it compares a lot of audio metadata fields between versions. Each field's check has a few possible outcomes and cases like missing data or metadata that's still being processed.

### End-to-end tests (Playwright)
*Not completed yet*
- Final smoke test of main flow.

### CI (if time allows)
*Not completed yet*
- Run the tests on every push with GitHub Actions.


## Usage
(how to use the app, fill out when I'm near end)


## Tech Stack

- **Language:** JavaScript
- **Frontend:** React + Vite, React Router
- **Backend:** Node.js + Express
- **Audio analysis:** FFmpeg + ffprobe
- **Waveform:** wavesurfer.js v7
- **Database:** MongoDB Atlas
- **Auth:** Passport (local strategy), express-session, connect-mongo, bcryptjs
- **File storage:** Cloudflare R2
- **Testing:** Postman/Newman (API), Playwright (E2E)


## Future Improvements
(update at end)