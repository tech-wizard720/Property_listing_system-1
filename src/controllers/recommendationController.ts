import { Request, Response, RequestHandler } from 'express';
import User from '../models/User';
import Property from '../models/Property';
import { CacheService } from '../services/cacheService';
import { AuthRequest } from '../middlewares/auth';

// Cache keys
const CACHE_KEYS = {
  USER_RECOMMENDATIONS: (userId: string) => `user:${userId}:recommendations`,
};

// GET /recommendations/search?email=user@example.com
// Search for a user by email address
export const searchUser: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email }).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error('[Search User] Error:', err);
    res.status(500).json({ error: 'Failed to search user' });
  }
};

// POST /recommendations/:propertyId
// Recommend a property to another user
export const recommendProperty: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { recipientEmail } = req.body;
    if (!recipientEmail) {
      res.status(400).json({ message: 'Recipient email is required' });
      return;
    }

    const property = await Property.findOne({ propertyId: req.params.propertyId });
    if (!property) {
      res.status(404).json({ message: 'Property not found' });
      return;
    }

    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
      res.status(404).json({ message: 'Recipient not found' });
      return;
    }

    const existingRecommendation = recipient.recommendationsReceived.find(
      rec => rec.propertyId === property.propertyId && 
             rec.recommendedBy.toString() === user.id
    );

    if (existingRecommendation) {
      res.status(400).json({ message: 'Property already recommended to this user' });
      return;
    }

    recipient.recommendationsReceived.push({
      propertyId: property.propertyId,
      recommendedBy: user.id,
      recommendedAt: new Date()
    });

    await recipient.save();
    await CacheService.del(CACHE_KEYS.USER_RECOMMENDATIONS(recipient._id.toString()));

    res.status(200).json({ message: 'Property recommended successfully' });
  } catch (err) {
    console.error('[Recommend Property] Error:', err);
    res.status(500).json({ error: 'Failed to recommend property' });
  }
};

// GET /recommendations
// Get all properties recommended to the authenticated user
export const getRecommendations: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const cacheKey = CACHE_KEYS.USER_RECOMMENDATIONS(user.id);
    const cachedRecommendations = await CacheService.get(cacheKey);
    if (cachedRecommendations) {
      res.json(cachedRecommendations);
      return;
    }

    const userDoc = await User.findById(user.id)
      .populate('recommendationsReceived.recommendedBy', 'email')
      .exec();

    if (!userDoc) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const recommendations = await Promise.all(
      userDoc.recommendationsReceived.map(async (rec) => {
        const property = await Property.findOne({ propertyId: rec.propertyId });
        return {
          property,
          recommendedBy: rec.recommendedBy,
          recommendedAt: rec.recommendedAt
        };
      })
    );

    await CacheService.set(cacheKey, recommendations);
    res.json(recommendations);
  } catch (err) {
    console.error('[Get Recommendations] Error:', err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
}; 