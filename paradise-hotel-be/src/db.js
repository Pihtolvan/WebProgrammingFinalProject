import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { config } from './config.js';

const dataDir = path.dirname(config.databasePath);
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(config.databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    description TEXT NOT NULL,
    rating REAL NOT NULL DEFAULT 4.0,
    has_free_parking INTEGER NOT NULL DEFAULT 0,
    has_wellness_center INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    price_per_night REAL NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    check_in TEXT NOT NULL,
    check_out TEXT NOT NULL,
    guests INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
  );
`);

const locationCount = db.prepare('SELECT COUNT(*) AS count FROM locations').get().count;
if (locationCount === 0) {
  const insertLocation = db.prepare(`
    INSERT INTO locations (name, city, address, description, rating, has_free_parking, has_wellness_center, image_url)
    VALUES (@name, @city, @address, @description, @rating, @hasFreeParking, @hasWellnessCenter, @imageUrl)
  `);

  const insertRoom = db.prepare(`
    INSERT INTO rooms (location_id, name, type, capacity, price_per_night, description, image_url)
    VALUES (@locationId, @name, @type, @capacity, @pricePerNight, @description, @imageUrl)
  `);

  const locations = [
    {
      name: 'Paradise Marina',
      city: 'Varna',
      address: '12 Seaside Boulevard, Varna',
      description: 'A premium seaside hotel with elegant interiors, ocean views, and quick access to the promenade.',
      rating: 4.8,
      hasFreeParking: 1,
      hasWellnessCenter: 1,
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      rooms: [
        { name: 'Marina Deluxe', type: 'Deluxe', capacity: 2, pricePerNight: 180, description: 'Sea-view room with balcony and king bed.', imageUrl: '' },
        { name: 'Marina Family Suite', type: 'Suite', capacity: 4, pricePerNight: 255, description: 'Spacious suite suited for longer family stays.', imageUrl: '' },
      ],
    },
    {
      name: 'Paradise Central',
      city: 'Sofia',
      address: '88 City Garden Avenue, Sofia',
      description: 'A contemporary city hotel designed for short breaks, events, and business travel.',
      rating: 4.5,
      hasFreeParking: 1,
      hasWellnessCenter: 0,
      imageUrl: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80',
      rooms: [
        { name: 'Executive Corner', type: 'Executive', capacity: 2, pricePerNight: 165, description: 'Business-ready room with desk and lounge chair.', imageUrl: '' },
        { name: 'City Twin', type: 'Standard', capacity: 2, pricePerNight: 135, description: 'Flexible twin room close to the business district.', imageUrl: '' },
      ],
    },
    {
      name: 'Paradise Spa Retreat',
      city: 'Velingrad',
      address: '5 Pine Forest Road, Velingrad',
      description: 'A relaxation-focused mountain property with pools, spa rituals, and tranquil surroundings.',
      rating: 4.9,
      hasFreeParking: 1,
      hasWellnessCenter: 1,
      imageUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      rooms: [
        { name: 'Wellness Studio', type: 'Studio', capacity: 2, pricePerNight: 210, description: 'Warm, quiet studio near the spa wing.', imageUrl: '' },
        { name: 'Forest Family Loft', type: 'Family', capacity: 5, pricePerNight: 295, description: 'Large family loft with panoramic windows.', imageUrl: '' },
      ],
    },
    {
      name: 'Paradise Riverside',
      city: 'Plovdiv',
      address: '41 Old Town Quay, Plovdiv',
      description: 'A boutique location mixing historic charm with modern comfort and weekend event space.',
      rating: 4.3,
      hasFreeParking: 0,
      hasWellnessCenter: 0,
      imageUrl: 'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1200&q=80',
      rooms: [
        { name: 'Boutique Queen', type: 'Boutique', capacity: 2, pricePerNight: 145, description: 'Cozy boutique room with classic interior details.', imageUrl: '' },
        { name: 'Riverside Suite', type: 'Suite', capacity: 3, pricePerNight: 205, description: 'Refined suite overlooking the riverwalk.', imageUrl: '' },
      ],
    },
  ];

  const seedLocations = db.transaction((items) => {
    for (const location of items) {
      const locationResult = insertLocation.run(location);
      for (const room of location.rooms) {
        insertRoom.run({ ...room, locationId: locationResult.lastInsertRowid });
      }
    }
  });

  seedLocations(locations);
}

const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@paradise.local');
if (!adminExists) {
  const passwordHash = bcrypt.hashSync('Admin123!', 10);
  db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, 'admin')
  `).run('Paradise Admin', 'admin@paradise.local', passwordHash);
}

export default db;
