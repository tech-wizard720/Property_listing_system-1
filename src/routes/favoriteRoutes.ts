import express from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite
} from '../controllers/favoriteController';

const router = express.Router();

// Apply authentication to all favorite routes
router.use(authMiddleware);

// Favorite routes
router.get('/', getFavorites);
router.post('/:propertyId', addFavorite);
router.delete('/:propertyId', removeFavorite);
router.get('/check/:propertyId', checkFavorite);

export default router; 