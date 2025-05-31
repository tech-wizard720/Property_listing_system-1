import { Request, Response, RequestHandler } from 'express';
import User from '../models/User';
import Property from '../models/Property';
import { CacheService } from '../services/cacheService';
import { AuthRequest } from '../middlewares/auth';

// Cache keys
const CACHE_KEYS = {
  USER_FAVORITES: (userId: string) => `user:${userId}:favorites`,
};

/**
 * Get user's favorite properties
 * GET /favorites
 */
export const getFavorites: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Try to get from cache first
    const cacheKey = CACHE_KEYS.USER_FAVORITES(user.id);
    const cachedFavorites = await CacheService.get(cacheKey);
    if (cachedFavorites) {
      res.json(cachedFavorites);
      return;
    }

    // If not in cache, get from database
    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Get full property details for each favorite
    const favoriteProperties = await Property.find({
      propertyId: { $in: userDoc.favorites }
    });

    // Cache the results
    await CacheService.set(cacheKey, favoriteProperties);

    res.json(favoriteProperties);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

/**
 * Add property to favorites
 * POST /favorites/:propertyId
 */
export const addFavorite: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const property = await Property.findOne({ propertyId: req.params.propertyId });
    if (!property) {
      res.status(404).json({ message: 'Property not found' });
      return;
    }

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if property is already in favorites
    if (userDoc.favorites.includes(property.propertyId)) {
      res.status(400).json({ message: 'Property already in favorites' });
      return;
    }

    // Add to favorites
    userDoc.favorites.push(property.propertyId);
    await userDoc.save();

    // Invalidate cache
    await CacheService.del(CACHE_KEYS.USER_FAVORITES(user.id));

    res.status(200).json({ message: 'Property added to favorites' });
  } catch (err) {
    console.error('Error adding favorite:', err);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
};

/**
 * Remove property from favorites
 * DELETE /favorites/:propertyId
 */
export const removeFavorite: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const property = await Property.findOne({ propertyId: req.params.propertyId });
    if (!property) {
      res.status(404).json({ message: 'Property not found' });
      return;
    }

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Remove from favorites
    userDoc.favorites = userDoc.favorites.filter(
      (favId) => favId !== property.propertyId
    );
    await userDoc.save();

    // Invalidate cache
    await CacheService.del(CACHE_KEYS.USER_FAVORITES(user.id));

    res.status(200).json({ message: 'Property removed from favorites' });
  } catch (err) {
    console.error('Error removing favorite:', err);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
};

/**
 * Check if property is in favorites
 * GET /favorites/check/:propertyId
 */
export const checkFavorite: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const property = await Property.findOne({ propertyId: req.params.propertyId });
    if (!property) {
      res.status(404).json({ message: 'Property not found' });
      return;
    }

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isFavorite = userDoc.favorites.includes(property.propertyId);
    res.json({ isFavorite });
  } catch (err) {
    console.error('Error checking favorite:', err);
    res.status(500).json({ error: 'Failed to check favorite status' });
  }
}; 