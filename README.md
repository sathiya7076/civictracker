# CivicTrack - Civic Issue Reporting and Tracking System

Citizens report public infrastructure problems, admins assign them to staff, and staff post progress until resolved.

**Status: Phases 1-4 of 7 delivered.** All three roles work: citizen, staff and admin (setup, auth, complaints + uploads, admin-created staff accounts, assignment, validated status workflow, evidence uploads, verification/closure, basic admin dashboard). Phases 5-7 (notifications UI + feedback, analytics/map/CSV reports, hardening + deployment docs) are built next. Nothing here has been deployed.

## Stack
- Client: React 18 + Vite (JS/JSX), React Router 6, Axios, Tailwind CSS 3
- Server: Node 18+, Express 4, Mongoose 8 (MongoDB Atlas), JWT, bcryptjs, Zod, Helmet, CORS, express-rate-limit
- Tests: Vitest + Supertest + mongodb-memory-server (server), Vitest + React Testing Library (client)
- Uploads: multer (memory storage) -> Cloudinary. Added in later phases: recharts, leaflet, react-leaflet

## Folder structure (delivered)
```
civictrack/
  package.json  docker-compose.yml  .gitignore  README.md
  server/
    .env.example  Dockerfile  vitest.config.js
    src/
      app.js  server.js
      config/       env.js db.js cloudinary.js
      models/       User Complaint ComplaintUpdate Notification Feedback
      middleware/   auth role error csrf validate validateObjectId uploadMiddleware
      validators/   auth complaint workflow
      services/     auth complaint upload workflow admin staff notification
      controllers/  auth complaint staff admin
      routes/       auth complaint staff admin
      utils/        ApiError asyncHandler token constants complaintId statusTransitions
      scripts/      seedAdmin.js
    tests/        auth.test.js complaint.test.js workflow.test.js
  client/
    .env.example  vite.config.js  tailwind.config.js  postcss.config.js
    src/ main.jsx App.jsx index.css
      api/ context/ components/ pages/ utils/ test/
```

## Setup
```bash
# 1. install (root has the `concurrently` dev tool)
npm install
npm run install:all

# 2. environment files
cp server/.env.example server/.env     # then edit (see below)
cp client/.env.example client/.env

# 3. create the first admin (once)

npm run seed:admin
# 4. run both apps
npm run dev          # API http://localhost:5000, client http://localhost:5173
```
Run separately: `npm run dev --prefix server` / `npm run dev --prefix client`.

### MongoDB Atlas (your action)
1. Create a free cluster at cloud.mongodb.com, then Database Access -> add a user with a password.
2. Network Access -> add your IP (for hosting, the host's outbound IPs or 0.0.0.0/0 with a strong password).
3. Connect -> Drivers -> copy the connection string into `MONGODB_URI`, adding `/civictrack` before `?`.

### Cloudinary (your action)
Create a free account, copy Cloud name, API key and API secret from the dashboard into `server/.env`. Required at startup now, used for uploads in Phase 3.

### Environment variables
Server startup stops with a clear message if any is missing or invalid: `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET` (32+ chars), `FRONTEND_URL`, `CLOUDINARY_*`. Client: `VITE_API_BASE_URL`.

## The three roles (try it)
1. **Admin**: created once with `npm run seed:admin`, then log in.
2. **Staff**: log in as admin -> *Staff* -> create a staff account, then log in as that staff member in another browser/profile.
3. **Citizen**: use *Register* on the site (public registration can only ever create citizens).

Typical flow: citizen reports -> admin assigns (Pending -> Assigned) -> staff starts work (In Progress), uploads before/after photos, marks Resolved -> admin verifies the evidence and closes (Closed). Admin can also reject (reason required) or reopen a Resolved complaint (note required).

## Auth design
- Password hashed with bcrypt (12 rounds). Hash is `select: false` and stripped from JSON.
- JWT (HS256, 1 hour) stored in an **HttpOnly** cookie (`Secure` + `SameSite=None` in production, `Lax` in development). No refresh token: the user logs in again after 1 hour (simple and safe for this project).
- CSRF: every non-GET request must send `X-Requested-With: XMLHttpRequest` (the Axios client does). CORS only allows `FRONTEND_URL`.
- Every request reloads the user, so suspensions and role changes apply immediately.
- Registration always creates a `citizen`; any `role` in the body is ignored. Admins come from `seed:admin`; staff will be created by admins (Phase 4).
- Login/register rate limit: 20 requests per 15 min per IP. Input validated with Zod; Mongo operator injection is blocked because fields must be plain strings.

## API (implemented so far)
All responses: `{ "success": true, "data": {...} }` or `{ "success": false, "message": "...", "errors": [{ "field", "message" }] }`.

| Method | Path | Auth | Body | Success |
|---|---|---|---|---|
| GET | /api/health | none | - | 200 `{status:"ok", database:"connected"}` |
| POST | /api/auth/register | none | `name, email, password, phone?` | 201 `{user}` + cookie |
| POST | /api/auth/login | none | `email, password` | 200 `{user}` + cookie |
| GET | /api/auth/me | cookie | - | 200 `{user}` |
| POST | /api/auth/logout | none | - | 200 clears cookie |
| POST | /api/complaints | citizen | multipart: `title, category, description, address, latitude?, longitude?, images[]` (max 5, JPEG/PNG/WebP, 5 MB each) | 201 `{complaint}` with `complaintId` like `CT-20261026-K7M2X`, status `Pending` |
| GET | /api/complaints/my | citizen | query: `page, limit(<=50), status, category, search, sort(newest\|oldest)` | 200 `{items, pagination:{page,limit,total,totalPages}}` |
| GET | /api/complaints/:id | owner citizen / assigned staff / admin | - | 200 `{complaint}` (others get 404) |
| GET | /api/complaints/:id/updates | same as above | - | 200 `{updates}` oldest first |
| PUT | /api/complaints/:id | owner citizen, status Pending only | any of `title, category, description, address, latitude, longitude` | 200 `{complaint}`; 409 if not Pending |
| DELETE | /api/complaints/:id | owner citizen, status Pending only | - | 200; 409 if not Pending |

**Staff** (role `staff`; only complaints assigned to them):

| Method | Path | Body / query | Success |
|---|---|---|---|
| GET | /api/staff/complaints | `page, limit, status, category, search, sort` | 200 `{items, pagination}` |
| GET | /api/staff/stats | - | 200 `{stats:{total, assigned, inProgress, completed}}` (completed = Resolved + Closed) |
| PUT | /api/staff/complaints/:id/status | `status` (`In Progress` or `Resolved`), `note?` | 200 `{complaint}`; 409 on an invalid transition |
| POST | /api/staff/complaints/:id/evidence | multipart `images[]` (1-5), `note?`; only while In Progress/Resolved | 201 `{complaint}` |

**Admin** (role `admin`):

| Method | Path | Body / query | Success |
|---|---|---|---|
| GET | /api/admin/dashboard | - | 200 `{totals:{total,pending,inProgress,resolved}, byStatus, byCategory, recentActivity}` |
| GET | /api/admin/complaints | `page, limit, status, category, priority, staff (id or "unassigned"), search, sort` | 200 `{items, pagination}` |
| PUT | /api/admin/complaints/:id/assign | `staffId, note?` (Pending/Assigned only; staff must be active) | 200 `{complaint}` status Assigned |
| PUT | /api/admin/complaints/:id/priority | `priority` Low/Medium/High/Urgent | 200 |
| PUT | /api/admin/complaints/:id/verify | `action` `close` (needs evidence) or `reopen` (needs `note`), `note?` | 200 |
| PUT | /api/admin/complaints/:id/reject | `note` (reason, 5+ chars) | 200 |
| GET | /api/admin/users | `page, limit, role, status, search` | 200 `{items, pagination}` |
| POST | /api/admin/staff | `name, email, password, phone?` | 201 `{user}` role staff |
| PUT | /api/admin/users/:id/status | `status` active/suspended (not yourself, not admins) | 200 |

Spec changes: staff progress notes use `PUT /api/staff/complaints/:id/status` and `POST .../evidence` instead of `POST /api/complaints/:id/updates`, and `PUT /api/admin/complaints/:id/reject` was added. Staff work details and progress update are one page. Notifications are created on every status change/assignment (stored in the database); the notification endpoints, feedback, reports/CSV and the issue map come in Phases 5-6. Editing photos after submission is not supported; cancelling deletes the complaint record but not its Cloudinary images.

Errors: 400 validation/invalid id/bad upload, 401 unauthenticated/expired, 403 suspended/forbidden/missing CSRF header, 409 duplicate email, 429 rate limited.

Example:
```bash
curl -i -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" -H "X-Requested-With: XMLHttpRequest" \
  -d '{"name":"Asha Kumar","email":"asha@example.com","password":"Passw0rdOK"}'
```

## Data model (Mongoose)
- **User**: name, email (unique, lowercase), passwordHash, role (citizen|staff|admin), phone, accountStatus
- **Complaint**: complaintId (unique), title, description, category, address, latitude/longitude?, citizenId -> User, assignedStaffId -> User?, priority, status, images[], resolutionEvidence[]
- **ComplaintUpdate**: complaint, actor, previousStatus, newStatus, note, evidenceImages[]
- **Notification**: recipient, complaint?, message, type, isRead
- **Feedback**: complaint (unique: one per complaint), citizen, rating 1-5, comment

Status model: Pending -> Assigned -> In Progress -> Resolved -> Closed; Pending/Assigned -> Rejected (admin); Resolved -> In Progress (admin reopen). The table lives in `server/src/utils/statusTransitions.js` and is enforced on the server; changes use an atomic update so two people cannot move the same complaint at once. Citizen-initiated reopen is not implemented. MongoDB has no SQL migrations: indexes are created from the schemas on startup.

## Tests
```bash
npm test                    # both
npm test --prefix server    # auth, complaint and workflow tests (lifecycle, transitions, role permissions, staff/admin management): validation, CSRF header, suspension, role escalation, upload rejection, ownership, edit/cancel rules
npm test --prefix client    # login form validation, ProtectedRoute redirects
```
Server tests download a MongoDB binary on first run (internet needed once). Planned for later phases: expired token, missing env vars. Cloudinary is mocked in tests.

## Docker (optional)
`docker compose up --build` runs the API with a local MongoDB (needs `server/.env`). The client deploys separately to Vercel.

## Deployment notes
- Client (Vercel): root `client`, build `npm run build`, output `dist`, env `VITE_API_BASE_URL=https://<api-host>/api`. Add a rewrite of all paths to `/index.html` for React Router.
- API (Render/Railway): root `server`, build `npm install`, start `npm start`, set all server env vars with `NODE_ENV=production` and `FRONTEND_URL=https://<your-vercel-domain>` (no trailing slash).
- Cross-site cookies need HTTPS on both sides.

## Troubleshooting
- "Invalid or missing environment variables": fill `server/.env` from the example.
- "MongoDB connection failed": check the Atlas password (URL-encode special characters), and the IP access list.
- 403 "Missing required X-Requested-With header": add the header when calling the API outside the React app (Postman/curl).
- Login works but `/me` returns 401 in production: check `FRONTEND_URL`, HTTPS, and that the browser allows third-party cookies for your domains.
