# wavTrace

wavTrace is a full-stack web app for audio review and revision tracking, similar concept to GitHub but designed for team-based audio deliverables instead of software development. A user uploads audio to be reviewed, the reviewer leaves timestamped notes for changes, and the user iterates based on feedback, with differences between iterations tracked using a version history pinned to the notes and feedback from each version.


## Planned features

**Versioning** - Tracks the full history of an audio project across iterations, cleanly logging who said what, when, and on which version so changes and feedback are easy to follow over time.

**User accounts** - Authentication with role-based permissions (owner, reviewer, view-only).

**Pin and region markers** - Reviewers can pin feedback to a specific timestamp or highlight a section of the track, making it clear exactly what each note is referring to.

**Waveform visualization** - Visual waveform display on the timeline.

**Metadata** - Displays audio metadata: loudness (LUFS, true peak, LRA), file specs (sample rate, bit depth, duration, format, bitrate), and clipping detection.

**Auto-detected version diff** - Shows changes between versions (loudness, dynamics, duration, file specs, clipping).

**Project search** - Search across projects by name.

**Approval** - Mark a version as "approved" or "final." Locks it from further comments and visually flags it in the version history.

**DAW marker export** - Export comment timestamps as a .txt file for offline reference.


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


#### Running it in Newman CLI
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


## Project structure

**Monorepo layout** (frontend/backend)

```
wavtrace/
├── backend/
│   ├── middleware/
│   ├── models/
│   │   ├── Comment.js
│   │   ├── Project.js
│   │   ├── User.js
│   │   └── Version.js
│   ├── routes/
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
├── docs/
│   ├── architecture-diagram.excalidraw
│   ├── architecture-diagram.png
│   ├── architecture-diagram-light.png
│   └── proposal.md
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   └── vite.config.js
└── README.md
```