# Hariganga – CPH Handover

A MERN (MongoDB · Express · React · Node) application for running the
**Centre Point Amravati** hotel handover inspection between **Hariganga** (the
developer) and **Centre Point Hospitality / CPH** (the operator).

It is a full rebuild of the original single-file HTML prototype, adding:

- **Per-user accounts** with roles (`admin`, `hariganga`, `cph`) and JWT auth
- **MongoDB persistence** of every item status, remark, and sign-off
- The same four screens — **Areas → Area checklist → Dashboard → Sign-off sheet**
- The complete checklist digitised from `Amravati Checklist 08.07.2025.xlsx`
  (public areas, BOH, floors 2–6, special-abled rooms, washrooms, licenses)

```
.
├── server/   Express API + Mongoose models (MongoDB Atlas)
└── client/   React + Vite + Tailwind single-page app
```

---

## Prerequisites

- **Node.js 18+** (built and tested on Node 25)
- A **MongoDB Atlas** connection string (free tier is fine)

---

## 1. Configure & run the API (`server/`)

```bash
cd server
npm install
cp .env.example .env        # then edit .env
```

Edit `server/.env` and paste your Atlas URI into `MONGODB_URI`, e.g.

```
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/hariganga_handover?retryWrites=true&w=majority
JWT_SECRET=<a-long-random-string>
```

Seed the database (creates the handover + the initial accounts):

```bash
npm run seed
```

Then start the API:

```bash
npm run dev      # http://localhost:4000  (auto-restart)
# or: npm start
```

### Seeded accounts

| Role       | Email                        | Password        |
| ---------- | ---------------------------- | --------------- |
| Admin      | `admin@hariganga.local`      | `ChangeMe123!`  |
| Hariganga  | `hariganga@hariganga.local`  | `Hariganga123!` |
| CPH        | `cph@hariganga.local`        | `Cph123!`       |

> Change `SEED_ADMIN_*` in `.env` before seeding for a real deployment, and set
> `SEED_DEMO_USERS=false` to skip the two demo accounts. New users are created
> from the in-app **Users** screen (admin only).

---

## 2. Run the web app (`client/`)

In a second terminal:

```bash
cd client
npm install
cp .env.example .env         # optional – defaults to http://localhost:4000/api
npm run dev                  # http://localhost:5173
```

Open http://localhost:5173 and sign in with one of the seeded accounts.

---

## Roles & permissions

| Capability                          | Admin | Hariganga | CPH |
| ----------------------------------- | :---: | :-------: | :-: |
| View areas / dashboard / sign-off   |  ✓   |    ✓     | ✓  |
| Set item status & remarks           |  ✓   | assigned sections only | assigned sections only |
| Set **Phase 2** / **Dropped** status |  ✓   |          |    |
| Add custom "Other" items            |  ✓   | assigned sections only | assigned sections only |
| Finalise the handover record        |  ✓   |    ✓     | ✓  |
| Create / edit / delete users        |  ✓   |          |    |
| Assign sections to users            |  ✓   |          |    |
| View the change audit + daily log   |  ✓   |          |    |

### Completion ("100%")

An item counts as **done** only once it reaches a closed state — **Accepted**
or **Dropped from List**. Items that are merely touched (Pending, Docs Pending,
Damaged, Next Visit, Phase 2) are *not* counted toward completion. So the
dashboard's **Completed %**, the area cards, and the room tiles all reflect how
much is genuinely resolved — not just how much has been looked at.

### Custom items & daily log

- **Custom items** — any area (and, for room floors, any individual room) has an
  *"Add another item (Other)"* box. Added items behave like normal checklist
  items (status + remarks) and count toward totals. Anyone who can edit the
  section can add/remove them; **Phase 2 / Dropped** still require an admin.
- **Daily log** (admin → Audit → *Daily Log* tab) — per day (IST), how many
  updates each user made and how many marked an item done.

### Section assignment & audit

- **Assignment** can be done two ways (both edit the same `assignedAreas`):
  - On the **Users** screen — pick sections when creating a user, and expand any
    user's *Sections* cell to add/remove them later.
  - On the **Assignments** screen — a matrix of sections × users; tick a box to
    grant a user a section.
  A Hariganga/CPH user can only change statuses and remarks in the sections
  assigned to them — everything else is **read-only** (shown with a lock). Admins
  can always edit every section. The rule is enforced on the server
  (`PUT /api/entries` returns `403` for unassigned sections), not just hidden in
  the UI.
- **Audit** (admin screen): every status/remark change is logged with the item,
  the old → new value, the user, and the timestamp — filterable by section and by
  user. (Each item also shows its own last-updated stamp inline.)

---

## API overview

All routes are under `/api` and (except `health` and `auth/login`) require a
`Authorization: Bearer <token>` header.

| Method | Path                      | Notes                                  |
| ------ | ------------------------- | -------------------------------------- |
| POST   | `/auth/login`             | → `{ token, user }`                    |
| GET    | `/auth/me`                | current user                           |
| GET    | `/checklist`              | template + status options + keywords   |
| GET    | `/handover`               | current handover meta                  |
| GET    | `/entries`                | all saved item states                  |
| PUT    | `/entries`                | upsert one item (status + remarks)     |
| GET    | `/signoffs/areas`         | area sign-offs                         |
| PUT    | `/signoffs/areas/:area`   | sign one side (role-enforced)          |
| GET    | `/signoffs/final`         | final sign-off record                  |
| POST   | `/signoffs/final`         | finalise the handover                  |
| GET/POST/PATCH/DELETE | `/users[...]` | admin only                             |
| PUT    | `/assignments/:area`      | set users assigned to a section (admin)|
| GET    | `/audit`                  | change log, `?area=` `?userId=` (admin)|
| GET    | `/audit/daily`            | per-day per-user summary (admin)       |
| GET    | `/custom-items`           | user-added items                       |
| POST   | `/custom-items`           | add an item to a section               |
| DELETE | `/custom-items/:id`       | remove a custom item                   |

---

## Data model (MongoDB)

- **users** — name, email, passwordHash, role, designation, active, **assignedAreas**
- **handovers** — the property being handed over (single: Centre Point Amravati)
- **entries** — one per `{handover, area, room, itemId}`: status, remarks, who/when
- **areasignoffs** — per area, Hariganga & CPH sides
- **finalsignoffs** — one per handover
- **auditlogs** — append-only change history (item, old → new, user, time)

The checklist *template* (areas, items, room lists) is static in
`server/src/data/checklist.js` and served via `/api/checklist`; only the dynamic
inspection state lives in the database.

---

## Notes

- This first build manages a single property, but every record is scoped by a
  `handover` id, so multi-property support is a small additive change.

---

## Deployment (`handover.centrepointgroup.in`)

Set these as real environment variables on the host (do **not** commit them):

**Server** (`server/.env` or host env):

```
MONGODB_URI=mongodb+srv://...                       # MongoDB Atlas
JWT_SECRET=<a-fresh-long-random-string>             # regenerate for prod
JWT_EXPIRES_IN=7d
PORT=4000
CLIENT_ORIGIN=https://handover.centrepointgroup.in  # for CORS
SEED_ADMIN_EMAIL=admin@centrepointgroup.in          # change before seeding
SEED_ADMIN_PASSWORD=<strong-password>
SEED_DEMO_USERS=false                               # skip demo accounts in prod
```

**Client** (build-time, baked into the bundle):

```
VITE_API_URL=https://handover.centrepointgroup.in/api
```

Then build the client and serve `client/dist` as static files, reverse-proxying
`/api` to the Node server:

```bash
cd client && npm ci && npm run build     # outputs client/dist
cd ../server && npm ci && npm run seed    # one-time, after setting prod env
npm start                                  # API on $PORT
```
