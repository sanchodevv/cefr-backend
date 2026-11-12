# CEFR Uz - Backend API

Node.js + Express + PostgreSQL (Prisma). Sign-up and sign-in use **Google accounts only** (Google Identity Services -> ID token -> our JWT).

## 1. Google setup (one time)
1. Open Google Cloud Console -> **APIs & Services -> Credentials -> Create credentials -> OAuth client ID**.
2. Application type: **Web application**.
3. **Authorized JavaScript origins**: `http://localhost:5173` (and your production domain).
4. Copy the **Client ID**. Use the *same* ID in the backend `.env` (`GOOGLE_CLIENT_ID`) and the frontend (`VITE_GOOGLE_CLIENT_ID`). No client secret is needed.
5. If the consent screen is in "Testing" mode, add your Google account as a test user.

## 2. Run locally
```bash
npm install
docker compose up -d                 # PostgreSQL on :5432
cp .env.example .env                 # then fill in JWT_SECRET, GOOGLE_CLIENT_ID, ADMIN_EMAILS
npx prisma migrate dev --name init   # creates tables
npm run db:seed                      # sample practice content
npm run dev                          # http://localhost:4000/health
```
Production: `npm run db:deploy && npm start`.

**Admins:** any Google account whose email is in `ADMIN_EMAILS` becomes `ADMIN` at sign-in. Everyone else is `STUDENT`.

## 3. API
Errors always look like `{ "error": { "message": "...", "details": [...] } }`. Lists return `{ data, meta: { page, limit, total } }`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/google` | public | Body `{ credential }`. Registers or logs in. Returns `{ token, user, isNewUser }` |
| GET | `/api/auth/me` | Bearer | Current user |
| GET | `/api/content/{reading\|listening\|writing\|speaking}` | public | List (`?difficulty=B1&taskType=TASK_1&page=1&limit=20`) |
| GET | `/api/content/{...}/:id` | public | Full test. **Answer keys are never returned** |
| GET/POST | `/api/admin/{reading-tests\|listening-tests\|writing-tasks\|speaking-tasks}` | ADMIN | List / create |
| GET/PUT/DELETE | `/api/admin/{...}/:id` | ADMIN | Read (with answer keys) / partial update / delete |
| POST | `/api/submissions` | Bearer | Submit answers and get a graded result |
| GET | `/api/submissions/me` | Bearer | My history |
| GET | `/api/submissions/me/stats` | Bearer | Averages per module + error breakdown |
| GET | `/api/submissions/:id` | owner/admin | One submission |

### Question format (reading / listening)
```json
{ "id": "q1", "part": "Part A", "type": "mcq", "prompt": "...", "options": ["A","B","C"], "correct": 1, "tag": "Detail" }
```
`type`: `mcq | tfng | matching | gap`. All are option-based; `correct` is the option index.

### Submit examples
```jsonc
{ "module": "READING",  "testId": "<uuid>", "answers": { "q1": 1, "q2": 0 } }
{ "module": "WRITING",  "testId": "<uuid>", "answers": { "text": "Dear Ali, ..." } }
{ "module": "SPEAKING", "testId": "<uuid>", "answers": { "transcript": "I think ..." } }
```

## 4. Scoring and AI feedback
- Reading/Listening are graded automatically. Correct answers are scaled to 35 and mapped to the 0-75 section score using the published bands (B1 38-50, B2 51-64, C1 65-75) with linear interpolation. This is an approximation of the official conversion.
- Writing/Speaking: if `ANTHROPIC_API_KEY` is set, an AI examiner returns a score, errors and tips (candidate text is treated as untrusted data). Without a key, or if the call fails, a simple rule-based fallback is used. `aiFeedback.source` tells you which one ran.
- Speaking takes a **transcript**. Audio upload and speech-to-text are not included.

## 5. Security notes
Helmet, CORS allow-list, request validation (Zod) on every input, rate limits (global, auth, per-user submissions), Google ID token verification (signature, audience, verified email), JWT checked against the DB on every request, answer keys hidden from public endpoints, no stack traces in production.
The JWT is returned in JSON and sent as `Authorization: Bearer`. If you store it in `localStorage`, an XSS bug could expose it; switch to an httpOnly cookie (plus CSRF protection) if you need stricter handling.

## 6. Frontend
Copy `frontend-integration/GoogleLoginButton.tsx` into your React app. Set `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID`.
