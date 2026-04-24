# Paradise Hotel Backend

## Stack
- Express
- SQLite (`better-sqlite3`)
- JWT authentication
- Docker 

## Run locally
```bash
npm install
npm run dev
```

The API starts at `http://localhost:4000`.

## Run with Docker
```bash
docker compose up --build
```

## Seeded admin account
- Email: `admin@paradise.local`
- Password: `Admin123!`

## Main endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/locations`
- `GET /api/rooms/availability`
- `POST /api/reservations`
- `GET /api/reservations/me`
- `DELETE /api/reservations/:id`
- `GET /api/admin/reservations`
- `GET /api/admin/dashboard`
- `GET /api/admin/locations`
- `POST /api/admin/locations`
- `PUT /api/admin/locations/:id`
- `DELETE /api/admin/locations/:id`
- `GET /api/admin/rooms`
- `POST /api/admin/rooms`
- `PUT /api/admin/rooms/:id`
- `DELETE /api/admin/rooms/:id`

## Debug endpoints
All demo/debug endpoints are grouped under `/debug/{feature}`:
- `POST /debug/reset`
- `POST /debug/demo-users-and-reservations`

## Notes
- The database file is stored in `./data/paradise.sqlite` locally.
- In Docker, the SQLite file is stored in the named volume `paradise_hotel_data`.
- The API includes seeded hotel locations and rooms so the frontend can be demonstrated immediately.
