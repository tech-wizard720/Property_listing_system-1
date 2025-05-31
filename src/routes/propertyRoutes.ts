import express from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  searchProperties,
  getFilterOptionsController,
} from '../controllers/propertyController';

const router = express.Router();

/**
 * Property Routes
 * 
 * GET /properties/search - Search properties with filters
 * GET /properties/filters - Get available filter options
 * POST /properties - Create a new property (requires auth)
 * GET /properties - Get all properties
 * GET /properties/:id - Get property by ID
 * PUT /properties/:id - Update property (requires auth)
 * DELETE /properties/:id - Delete property (requires auth)
 */

// Search and filter routes
router.get('/search', searchProperties);
router.get('/filters', getFilterOptionsController);

// CRUD routes
router.post('/', authMiddleware, createProperty);
router.get('/', getAllProperties);
router.get('/:id', getPropertyById);
router.put('/:id', authMiddleware, updateProperty);
router.delete('/:id', authMiddleware, deleteProperty);

export default router;
