import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';
import { authRequired, adminRequired } from './middleware/auth.js';
import { config } from './config.js';
import {
  addMonths,
  boolFromQuery,
  createMonthLabel,
  isValidDateRange,
  randomInteger,
  toDateOnly,
} from './utils.js';

const app = express();

app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());

const createToken = (user) => jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });

const mapLocation = (row) => ({
  id: row.id,
  name: row.name,
  city: row.city,
  address: row.address,
  description: row.description,
  rating: Number(row.rating),
  hasFreeParking: Boolean(row.has_free_parking),
  hasWellnessCenter: Boolean(row.has_wellness_center),
  imageUrl: row.image_url,
  createdAt: row.created_at,
});

const locationSelect = `
  l.id AS location_id,
  l.name AS location_name,
  l.city AS location_city,
  l.address AS location_address,
  l.description AS location_description,
  l.rating AS location_rating,
  l.has_free_parking AS location_has_free_parking,
  l.has_wellness_center AS location_has_wellness_center,
  l.image_url AS location_image_url
`;

const mapRoom = (row) => ({
  id: row.id,
  locationId: row.location_id,
  name: row.name,
  type: row.type,
  capacity: Number(row.capacity),
  pricePerNight: Number(row.pricePerNight),
  description: row.description,
  imageUrl: row.imageUrl,
  createdAt: row.createdAt ?? row.created_at ?? null,
  location: {
    id: row.location_id,
    name: row.location_name,
    city: row.location_city,
    address: row.location_address,
    description: row.location_description,
    rating: Number(row.location_rating),
    hasFreeParking: Boolean(row.location_has_free_parking),
    hasWellnessCenter: Boolean(row.location_has_wellness_center),
    imageUrl: row.location_image_url,
  },
});

const mapReservation = (row) => ({
  id: row.id,
  checkIn: row.checkIn,
  checkOut: row.checkOut,
  guests: Number(row.guests),
  status: row.status,
  createdAt: row.createdAt,
  guestName: row.guestName,
  guestEmail: row.guestEmail,
  roomName: row.roomName,
  roomType: row.roomType,
  locationName: row.locationName,
  locationCity: row.locationCity,
});

const findLocationById = (locationId) => {
  const row = db.prepare('SELECT * FROM locations WHERE id = ?').get(locationId);
  return row ? mapLocation(row) : null;
};

const roomBaseSelect = `
  SELECT
    r.id,
    r.location_id,
    r.name,
    r.type,
    r.capacity,
    r.price_per_night AS pricePerNight,
    r.description,
    r.image_url AS imageUrl,
    r.created_at AS createdAt,
    ${locationSelect}
  FROM rooms r
  JOIN locations l ON l.id = r.location_id
`;

const findRoomById = (roomId) => {
  const row = db.prepare(`${roomBaseSelect} WHERE r.id = ?`).get(roomId);
  return row ? mapRoom(row) : null;
};

const buildLocationFilters = (query, params) => {
  const clauses = [];

  if (query.search) {
    clauses.push('LOWER(l.name) LIKE ?');
    params.push(`%${String(query.search).trim().toLowerCase()}%`);
  }

  if (query.city) {
    clauses.push('LOWER(l.city) LIKE ?');
    params.push(`%${String(query.city).trim().toLowerCase()}%`);
  }

  if (query.rating) {
    clauses.push('l.rating >= ?');
    params.push(Number(query.rating));
  }

  const freeParking = boolFromQuery(query.freeParking);
  if (freeParking === true) {
    clauses.push('l.has_free_parking = 1');
  }

  const wellnessCenter = boolFromQuery(query.wellnessCenter);
  if (wellnessCenter === true) {
    clauses.push('l.has_wellness_center = 1');
  }

  return clauses;
};

const availableRoomQuery = (additionalWhere = '') => `
  ${roomBaseSelect}
  WHERE r.capacity >= ?
    ${additionalWhere}
    AND NOT EXISTS (
      SELECT 1
      FROM reservations res
      WHERE res.room_id = r.id
        AND res.status = 'active'
        AND NOT (? <= res.check_in OR ? >= res.check_out)
    )
  ORDER BY l.rating DESC, r.price_per_night ASC
`;

const validateLocationPayload = ({ name, city, address, description, rating }) => {
  if (!name || !city || !address || !description || rating === undefined || rating === null || rating === '') {
    return 'Name, city, address, description, and rating are required.';
  }

  const numericRating = Number(rating);
  if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return 'Rating must be a number between 1 and 5.';
  }

  return null;
};

const validateRoomPayload = ({ locationId, name, type, capacity, pricePerNight, description }) => {
  if (!locationId || !name || !type || capacity === undefined || capacity === null || pricePerNight === undefined || pricePerNight === null || !description) {
    return 'Location, name, type, capacity, price per night, and description are required.';
  }

  const numericCapacity = Number(capacity);
  const numericPrice = Number(pricePerNight);

  if (Number.isNaN(numericCapacity) || numericCapacity < 1) {
    return 'Capacity must be at least 1.';
  }

  if (Number.isNaN(numericPrice) || numericPrice <= 0) {
    return 'Price per night must be greater than 0.';
  }

  const location = findLocationById(Number(locationId));
  if (!location) {
    return 'Location not found.';
  }

  return null;
};

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.post('/api/auth/register', (request, response) => {
  const { name, email, password } = request.body;

  if (!name || !email || !password || password.length < 6) {
    return response.status(400).json({ message: 'Name, email, and a 6+ character password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return response.status(409).json({ message: 'An account with that email already exists.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash)
    VALUES (?, ?, ?)
  `).run(String(name).trim(), normalizedEmail, passwordHash);

  return response.status(201).json({
    message: 'Account created successfully.',
    user: {
      id: result.lastInsertRowid,
      name: String(name).trim(),
      email: normalizedEmail,
      role: 'user',
    },
  });
});

app.post('/api/auth/login', (request, response) => {
  const { email, password } = request.body;
  const userRecord = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').trim().toLowerCase());

  if (!userRecord || !bcrypt.compareSync(password || '', userRecord.password_hash)) {
    return response.status(401).json({ message: 'Invalid email or password.' });
  }

  const user = {
    id: userRecord.id,
    name: userRecord.name,
    email: userRecord.email,
    role: userRecord.role,
  };

  return response.json({
    token: createToken(user),
    user,
  });
});

app.get('/api/auth/me', authRequired, (request, response) => {
  response.json({ user: request.user });
});

app.get('/api/locations', (request, response) => {
  const params = [];
  const whereClauses = buildLocationFilters(request.query, params);
  const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const rows = db.prepare(`
    SELECT *
    FROM locations l
    ${where}
    ORDER BY l.rating DESC, l.name ASC
  `).all(...params);

  response.json({ locations: rows.map(mapLocation) });
});

app.get('/api/rooms/availability', (request, response) => {
  const { checkIn, checkOut, guests = 1 } = request.query;

  if (!isValidDateRange(checkIn, checkOut)) {
    return response.status(400).json({ message: 'Please provide a valid date range.' });
  }

  const params = [Number(guests)];
  const locationClauses = buildLocationFilters(request.query, params);
  const extraWhere = locationClauses.length > 0 ? `AND ${locationClauses.join(' AND ')}` : '';

  params.push(checkOut, checkIn);

  const rooms = db.prepare(availableRoomQuery(extraWhere)).all(...params).map(mapRoom);
  response.json({ rooms });
});

app.post('/api/reservations', authRequired, (request, response) => {
  const { roomId, checkIn, checkOut, guests } = request.body;

  if (!roomId || !isValidDateRange(checkIn, checkOut) || !guests) {
    return response.status(400).json({ message: 'Room, dates, and guest count are required.' });
  }

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  if (!room) {
    return response.status(404).json({ message: 'Room not found.' });
  }

  if (Number(guests) > room.capacity) {
    return response.status(400).json({ message: 'Guest count exceeds the room capacity.' });
  }

  const overlap = db.prepare(`
    SELECT id
    FROM reservations
    WHERE room_id = ?
      AND status = 'active'
      AND NOT (? <= check_in OR ? >= check_out)
  `).get(roomId, checkOut, checkIn);

  if (overlap) {
    return response.status(409).json({ message: 'This room is no longer available for those dates.' });
  }

  const result = db.prepare(`
    INSERT INTO reservations (user_id, room_id, check_in, check_out, guests, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `).run(request.user.id, roomId, checkIn, checkOut, Number(guests));

  response.status(201).json({
    message: 'Reservation created successfully.',
    reservationId: result.lastInsertRowid,
  });
});

app.get('/api/reservations/me', authRequired, (request, response) => {
  const reservations = db.prepare(`
    SELECT
      res.id,
      res.check_in AS checkIn,
      res.check_out AS checkOut,
      res.guests,
      res.status,
      res.created_at AS createdAt,
      rooms.name AS roomName,
      rooms.type AS roomType,
      locations.name AS locationName,
      locations.city AS locationCity
    FROM reservations res
    JOIN rooms ON rooms.id = res.room_id
    JOIN locations ON locations.id = rooms.location_id
    WHERE res.user_id = ?
    ORDER BY res.created_at DESC
  `).all(request.user.id).map(mapReservation);

  response.json({ reservations });
});

app.delete('/api/reservations/:id', authRequired, (request, response) => {
  const reservationId = Number(request.params.id);
  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservationId);

  if (!reservation) {
    return response.status(404).json({ message: 'Reservation not found.' });
  }

  const canManage = request.user.role === 'admin' || reservation.user_id === request.user.id;
  if (!canManage) {
    return response.status(403).json({ message: 'You cannot cancel this reservation.' });
  }

  db.prepare(`UPDATE reservations SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP WHERE id = ?`).run(reservationId);
  response.json({ message: 'Reservation cancelled.' });
});

app.get('/api/admin/reservations', authRequired, adminRequired, (_request, response) => {
  const reservations = db.prepare(`
    SELECT
      res.id,
      res.check_in AS checkIn,
      res.check_out AS checkOut,
      res.guests,
      res.status,
      res.created_at AS createdAt,
      rooms.name AS roomName,
      rooms.type AS roomType,
      locations.name AS locationName,
      locations.city AS locationCity,
      users.name AS guestName,
      users.email AS guestEmail
    FROM reservations res
    JOIN rooms ON rooms.id = res.room_id
    JOIN locations ON locations.id = rooms.location_id
    JOIN users ON users.id = res.user_id
    ORDER BY res.created_at DESC
  `).all().map(mapReservation);

  response.json({ reservations });
});

app.get('/api/admin/dashboard', authRequired, adminRequired, (_request, response) => {
  const totalReservations = db.prepare('SELECT COUNT(*) AS count FROM reservations').get().count;
  const activeReservations = db.prepare(`SELECT COUNT(*) AS count FROM reservations WHERE status = 'active'`).get().count;
  const cancelledReservations = db.prepare(`SELECT COUNT(*) AS count FROM reservations WHERE status = 'cancelled'`).get().count;
  const totalUsers = db.prepare(`SELECT COUNT(*) AS count FROM users WHERE role = 'user'`).get().count;
  const totalLocations = db.prepare(`SELECT COUNT(*) AS count FROM locations`).get().count;
  const totalRooms = db.prepare(`SELECT COUNT(*) AS count FROM rooms`).get().count;

  const allReservations = db.prepare('SELECT created_at FROM reservations ORDER BY created_at ASC').all();
  const monthMap = new Map();
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date();
    date.setMonth(date.getMonth() - index);
    monthMap.set(createMonthLabel(date), 0);
  }
  for (const item of allReservations) {
    const label = createMonthLabel(item.created_at);
    if (monthMap.has(label)) {
      monthMap.set(label, monthMap.get(label) + 1);
    }
  }

  const reservationsByLocation = db.prepare(`
    SELECT locations.name, COUNT(*) AS count
    FROM reservations
    JOIN rooms ON rooms.id = reservations.room_id
    JOIN locations ON locations.id = rooms.location_id
    GROUP BY locations.id, locations.name
    ORDER BY count DESC, locations.name ASC
  `).all();

  const reservationsByStatus = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM reservations
    GROUP BY status
    ORDER BY count DESC
  `).all();

  response.json({
    summary: {
      totalReservations,
      activeReservations,
      cancelledReservations,
      totalUsers,
      totalLocations,
      totalRooms,
    },
    reservationsByMonth: Array.from(monthMap.entries()).map(([month, count]) => ({ month, count })),
    reservationsByLocation,
    reservationsByStatus,
  });
});

app.get('/api/admin/locations', authRequired, adminRequired, (_request, response) => {
  const locations = db.prepare(`
    SELECT
      l.*,
      COUNT(r.id) AS room_count
    FROM locations l
    LEFT JOIN rooms r ON r.location_id = l.id
    GROUP BY l.id
    ORDER BY l.rating DESC, l.name ASC
  `).all().map((row) => ({ ...mapLocation(row), roomCount: Number(row.room_count) }));

  response.json({ locations });
});

app.post('/api/admin/locations', authRequired, adminRequired, (request, response) => {
  const payload = request.body;
  const validationMessage = validateLocationPayload(payload);

  if (validationMessage) {
    return response.status(400).json({ message: validationMessage });
  }

  const {
    name,
    city,
    address,
    description,
    rating,
    hasFreeParking = false,
    hasWellnessCenter = false,
    imageUrl = '',
  } = payload;

  const result = db.prepare(`
    INSERT INTO locations (name, city, address, description, rating, has_free_parking, has_wellness_center, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    String(name).trim(),
    String(city).trim(),
    String(address).trim(),
    String(description).trim(),
    Number(rating),
    hasFreeParking ? 1 : 0,
    hasWellnessCenter ? 1 : 0,
    String(imageUrl || '').trim(),
  );

  response.status(201).json({
    message: 'Location created successfully.',
    location: findLocationById(result.lastInsertRowid),
  });
});

app.put('/api/admin/locations/:id', authRequired, adminRequired, (request, response) => {
  const locationId = Number(request.params.id);
  const current = findLocationById(locationId);
  if (!current) {
    return response.status(404).json({ message: 'Location not found.' });
  }

  const payload = request.body;
  const validationMessage = validateLocationPayload(payload);
  if (validationMessage) {
    return response.status(400).json({ message: validationMessage });
  }

  const {
    name,
    city,
    address,
    description,
    rating,
    hasFreeParking = false,
    hasWellnessCenter = false,
    imageUrl = '',
  } = payload;

  db.prepare(`
    UPDATE locations
    SET name = ?, city = ?, address = ?, description = ?, rating = ?, has_free_parking = ?, has_wellness_center = ?, image_url = ?
    WHERE id = ?
  `).run(
    String(name).trim(),
    String(city).trim(),
    String(address).trim(),
    String(description).trim(),
    Number(rating),
    hasFreeParking ? 1 : 0,
    hasWellnessCenter ? 1 : 0,
    String(imageUrl || '').trim(),
    locationId,
  );

  response.json({
    message: 'Location updated successfully.',
    location: findLocationById(locationId),
  });
});

app.delete('/api/admin/locations/:id', authRequired, adminRequired, (request, response) => {
  const locationId = Number(request.params.id);
  const current = findLocationById(locationId);
  if (!current) {
    return response.status(404).json({ message: 'Location not found.' });
  }

  const hasReservations = db.prepare(`
    SELECT COUNT(*) AS count
    FROM reservations
    JOIN rooms ON rooms.id = reservations.room_id
    WHERE rooms.location_id = ?
  `).get(locationId).count;

  if (hasReservations > 0) {
    return response.status(409).json({ message: 'Locations with reservations cannot be deleted in the demo backend.' });
  }

  db.prepare('DELETE FROM locations WHERE id = ?').run(locationId);
  response.json({ message: 'Location deleted successfully.' });
});

app.get('/api/admin/rooms', authRequired, adminRequired, (_request, response) => {
  const rooms = db.prepare(`${roomBaseSelect} ORDER BY l.name ASC, r.price_per_night ASC, r.name ASC`).all().map(mapRoom);
  response.json({ rooms });
});

app.post('/api/admin/rooms', authRequired, adminRequired, (request, response) => {
  const payload = request.body;
  const validationMessage = validateRoomPayload(payload);
  if (validationMessage) {
    const status = validationMessage === 'Location not found.' ? 404 : 400;
    return response.status(status).json({ message: validationMessage });
  }

  const {
    locationId,
    name,
    type,
    capacity,
    pricePerNight,
    description,
    imageUrl = '',
  } = payload;

  const result = db.prepare(`
    INSERT INTO rooms (location_id, name, type, capacity, price_per_night, description, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    Number(locationId),
    String(name).trim(),
    String(type).trim(),
    Number(capacity),
    Number(pricePerNight),
    String(description).trim(),
    String(imageUrl || '').trim(),
  );

  response.status(201).json({
    message: 'Room created successfully.',
    room: findRoomById(result.lastInsertRowid),
  });
});

app.put('/api/admin/rooms/:id', authRequired, adminRequired, (request, response) => {
  const roomId = Number(request.params.id);
  const current = findRoomById(roomId);
  if (!current) {
    return response.status(404).json({ message: 'Room not found.' });
  }

  const payload = request.body;
  const validationMessage = validateRoomPayload(payload);
  if (validationMessage) {
    const status = validationMessage === 'Location not found.' ? 404 : 400;
    return response.status(status).json({ message: validationMessage });
  }

  const {
    locationId,
    name,
    type,
    capacity,
    pricePerNight,
    description,
    imageUrl = '',
  } = payload;

  db.prepare(`
    UPDATE rooms
    SET location_id = ?, name = ?, type = ?, capacity = ?, price_per_night = ?, description = ?, image_url = ?
    WHERE id = ?
  `).run(
    Number(locationId),
    String(name).trim(),
    String(type).trim(),
    Number(capacity),
    Number(pricePerNight),
    String(description).trim(),
    String(imageUrl || '').trim(),
    roomId,
  );

  response.json({
    message: 'Room updated successfully.',
    room: findRoomById(roomId),
  });
});

app.delete('/api/admin/rooms/:id', authRequired, adminRequired, (request, response) => {
  const roomId = Number(request.params.id);
  const current = findRoomById(roomId);
  if (!current) {
    return response.status(404).json({ message: 'Room not found.' });
  }

  const reservationCount = db.prepare('SELECT COUNT(*) AS count FROM reservations WHERE room_id = ?').get(roomId).count;
  if (reservationCount > 0) {
    return response.status(409).json({ message: 'Rooms with reservations cannot be deleted in the demo backend.' });
  }

  db.prepare('DELETE FROM rooms WHERE id = ?').run(roomId);
  response.json({ message: 'Room deleted successfully.' });
});

app.post('/debug/reset', (_request, response) => {
  db.prepare('DELETE FROM reservations').run();
  db.prepare("DELETE FROM users WHERE role = 'user'").run();
  response.json({ message: 'Demo data reset successfully.' });
});

app.post('/debug/demo-users-and-reservations', (_request, response) => {
  const adminUser = db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").get();
  const rooms = db.prepare('SELECT id, capacity FROM rooms ORDER BY id').all();

  if (!adminUser || rooms.length === 0) {
    return response.status(400).json({ message: 'Seed data is missing.' });
  }

  const createdUsers = [];
  const createdReservations = [];
  const timestamp = Date.now();
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, 'user')
  `);
  const insertReservation = db.prepare(`
    INSERT INTO reservations (user_id, room_id, check_in, check_out, guests, status, cancelled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const createDemoData = db.transaction(() => {
    for (let userIndex = 1; userIndex <= 3; userIndex += 1) {
      const email = `demo.user.${userIndex}.${timestamp}@paradise.local`;
      const passwordHash = bcrypt.hashSync('Password123!', 10);
      const userResult = insertUser.run(`Demo Guest ${userIndex}`, email, passwordHash);
      createdUsers.push({ id: userResult.lastInsertRowid, email });

      const reservationCount = randomInteger(2, 3);
      for (let reservationIndex = 0; reservationIndex < reservationCount; reservationIndex += 1) {
        let created = false;
        let attempts = 0;

        while (!created && attempts < 25) {
          attempts += 1;
          const monthOffset = randomInteger(-5, 5);
          const baseDate = addMonths(new Date(), monthOffset);
          baseDate.setDate(randomInteger(3, 23));
          const stayLength = randomInteger(2, 5);
          const checkIn = toDateOnly(baseDate);
          const checkOutDate = new Date(baseDate);
          checkOutDate.setDate(checkOutDate.getDate() + stayLength);
          const checkOut = toDateOnly(checkOutDate);
          const guests = randomInteger(1, 5);
          const eligibleRooms = rooms.filter((room) => room.capacity >= guests);
          const room = eligibleRooms[randomInteger(0, eligibleRooms.length - 1)];

          const overlap = db.prepare(`
            SELECT id
            FROM reservations
            WHERE room_id = ?
              AND status = 'active'
              AND NOT (? <= check_in OR ? >= check_out)
          `).get(room.id, checkOut, checkIn);

          if (!overlap) {
            createdReservations.push({ roomId: room.id, checkIn, checkOut, guests, userId: userResult.lastInsertRowid });
            created = true;
          }
        }
      }
    }

    createdReservations.forEach((reservation, index) => {
      const isCancelled = index === 0 || (index > 0 && Math.random() < 0.25);
      insertReservation.run(
        reservation.userId,
        reservation.roomId,
        reservation.checkIn,
        reservation.checkOut,
        reservation.guests,
        isCancelled ? 'cancelled' : 'active',
        isCancelled ? new Date().toISOString() : null,
      );
    });
  });

  createDemoData();

  response.json({
    message: 'Demo users and reservations generated successfully.',
    usersCreated: createdUsers.length,
    reservationsCreated: createdReservations.length,
    sampleCredentials: {
      password: 'Password123!',
      users: createdUsers,
    },
  });
});

app.listen(config.port, () => {
  console.log(`Paradise Hotel API listening on http://localhost:${config.port}`);
});
