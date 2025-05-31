import express from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  searchUser,
  recommendProperty,
  getRecommendations
} from '../controllers/recommendationController';

const router = express.Router();

// GET /recommendations/search?email=user@example.com - Search for a user by email
router.get('/search', authMiddleware, searchUser);

// POST /recommendations/:propertyId - Recommend a property to another user
// Body: { recipientEmail: string }
router.post('/:propertyId', authMiddleware, recommendProperty);

// GET /recommendations - Get all properties recommended to the authenticated user
router.get('/', authMiddleware, getRecommendations);

export default router; 