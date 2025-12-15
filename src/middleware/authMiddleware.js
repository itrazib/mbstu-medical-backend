import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    console.log(token)

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded)

    const db = await getDB();
    const user = await db
      .collection('users')
      .findOne({ _id: new ObjectId(decoded.id) });  // <-- FIX HERE

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.role === 'pending' || user.isApproved === false) {
      return res.status(403).json({ message: 'Account pending approval' });
    }

    delete user.password;
    req.user = user;
    console.log(req.user)

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export default authMiddleware;
