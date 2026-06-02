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

Testing plan as the app gets built:

**API tests (Newman)** - Cover the auth and project routes, including the role-based permission rules. Test data is created and stored in a separate testing database so the real one doesn't get polluted with dummy data.

**Unit tests (Mocha/Chai)** - Mostly for the version diff feature since it compares a lot of audio metadata fields between versions. Each field's check has a few possible outcomes and cases like missing data or metadata that's still being processed.

**End-to-end tests (Playwright)** - Final smoke test of main flow.

**CI (if time allows)** - Run the tests on every push with GitHub Actions.


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