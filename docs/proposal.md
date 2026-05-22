## Project Idea
A full-stack web app for audio review and revision tracking, similar concept to GitHub but designed for team-based audio deliverables instead of software development. A user uploads audio track(s) to be reviewed, the reviewer leaves timestamped notes for changes, and the user iterates based on feedback, with differences between iterations tracked using a version history pinned to the notes and feedback from each version.


## Features
**Versioning** - Tracks the full history of an audio project across iterations, cleanly logging who said what, when, and on which version so changes and feedback are easy to follow over time.

**User accounts** - Authentication with role-based permissions (owner, reviewer, view-only).

**Pin and region markers** - Reviewers can pin feedback to a specific timestamp or highlight a section of the track, making it clear exactly what each note is referring to.

**Waveform visualization** - Visual waveform display on the timeline.

**Metadata** - Displays audio metadata: loudness (LUFS, true peak, LRA), file specs (sample rate, bit depth, duration, format, bitrate), and clipping detection.

**Auto-detected version diff** - Shows changes between versions (loudness, dynamics, duration, file specs, clipping).

**Project search** - Search across projects by name.

**Approval** - Mark a version as "approved" or "final." Locks it from further comments and visually flags it in the version history.

**DAW marker export** - Export comment timestamps as a .txt file for offline reference.


## Target Audience
- Music companies with creation teams where multiple people give feedback on the work in progress, such as composers, producers, artists, engineers, A&R, and music directors on records, film scores, or game soundtracks.
- Broader media teams working with audio in client-based settings, such as video game studios, film production, and advertising agencies.
- Sound designers or musicians working on solo projects with many versions that need clean note and history tracking.
- Teachers, to give student feedback in audio heavy courses (like sound design for visual media or music related courses)


## Tech Stack
- **Frontend:** React (Vite), React Router, wavesurfer.js, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express
- **Audio Processing:** FFmpeg (ffprobe)
- **File Storage:** Cloudflare R2
- **Database:** MongoDB Atlas
- **Authentication:** JWT + bcrypt
- **Deployment:** Render


## Cost Estimate
Three services cost money: **Render** (hosting), **MongoDB Atlas** (database), and **Cloudflare R2** (storage).

| Service | Free | Production-ready | At scale |
|---|---|---|---|
| Render - frontend (static) | $0 | $0 | $0 |
| Render - backend (web service) | $0 (cold starts, 512 MB) | $7–$25/mo (no cold starts) | $25–$85+/mo per instance |
| MongoDB Atlas | $0 (M0, no backups) | $8-$57/mo (Flex -> M10) | ~$190/mo+ (M30+) |
| Cloudflare R2 | $0 (10 GB, free egress) | ~$0-$1/mo | $0.015/GB-mo, egress free |
| **Total** | **$0/mo** | **~$15–$85/mo** | **~$150-$600/mo** |
