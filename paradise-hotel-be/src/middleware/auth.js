import jwt from 'jsonwebtoken';
import db from '../db.js';
import { config } from '../config.js';

export const authRequired = (request, response, next) => {
  const header = request.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const token = header.replace('Bearer ', '');
    const payload = jwt.verify(token, config.jwtSecret);
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(payload.sub);

    if (!user) {
      return response.status(401).json({ message: 'Invalid token.' });
    }

    request.user = user;
    return next();
  } catch {
    return response.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export const adminRequired = (request, response, next) => {
  if (request.user?.role !== 'admin') {
    return response.status(403).json({ message: 'Admin access required.' });
  }

  return next();
};
