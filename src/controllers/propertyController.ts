import { Request, Response, RequestHandler } from 'express';
import Property, { IProperty } from '../models/Property';
import { CacheService } from '../services/cacheService';

// Cache keys
const CACHE_KEYS = {
  PROPERTY: (id: string) => `property:${id}`,
  PROPERTIES: 'properties:all',
  SEARCH: (query: string) => `search:${query}`,
  FILTERS: 'filters:all'
};

/**
 * Extended Request interface to include authenticated user
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Create a new property
 * POST /properties
 */
export const createProperty: RequestHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Parse the date if it's in DD/MM/YY format
    const propertyData = { ...req.body };
    if (propertyData.availableFrom) {
      const [day, month, year] = propertyData.availableFrom.split('/');
      // Convert to YYYY-MM-DD format
      propertyData.availableFrom = new Date(`20${year}-${month}-${day}`);
    }
    
    const property = await Property.create({
      ...propertyData,
      createdBy: user.id,
    });

    // Invalidate relevant caches
    await CacheService.delByPattern('properties:*');
    await CacheService.delByPattern('search:*');

    res.status(201).json(property);
  } catch (err) {
    console.error('Error creating property:', err);
    res.status(500).json({ error: 'Failed to create property', details: err });
  }
};

/**
 * Get all properties
 * GET /properties
 */
export const getAllProperties: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Try to get from cache first
    const cachedProperties = await CacheService.get<IProperty[]>(CACHE_KEYS.PROPERTIES);
    if (cachedProperties) {
      res.status(200).json(cachedProperties);
      return;
    }

    // If not in cache, get from database
    const properties = await Property.find();
    
    // Cache the results
    await CacheService.set(CACHE_KEYS.PROPERTIES, properties);
    
    res.status(200).json(properties);
  } catch (err) {
    console.error('Error fetching properties:', err);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
};

/**
 * Get property by ID
 * GET /properties/:id
 */
export const getPropertyById: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const cacheKey = CACHE_KEYS.PROPERTY(req.params.id);
    
    // Try to get from cache first
    const cachedProperty = await CacheService.get<IProperty>(cacheKey);
    if (cachedProperty) {
      res.json(cachedProperty);
      return;
    }

    // If not in cache, get from database
    const property = await Property.findOne({ propertyId: req.params.id });
    
    if (!property) {
      res.status(404).json({ message: 'Property not found' });
      return;
    }

    // Cache the result
    await CacheService.set(cacheKey, property);
    
    res.json(property);
  } catch (err) {
    console.error('Error fetching property:', err);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
};

/**
 * Update property
 * PUT /properties/:id
 */
export const updateProperty: RequestHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const property = await Property.findOne({ propertyId: req.params.id });

    if (!property) {
      res.status(404).json({ message: 'Property not found' });
      return;
    }

    if (property.createdBy?.toString() !== user.id) {
      res.status(403).json({ message: 'Not allowed to update this property' });
      return;
    }

    const updated = await Property.findOneAndUpdate(
      { propertyId: req.params.id }, 
      req.body, 
      { new: true }
    );

    // Invalidate relevant caches
    await CacheService.del(CACHE_KEYS.PROPERTY(req.params.id));
    await CacheService.delByPattern('properties:*');
    await CacheService.delByPattern('search:*');

    res.json(updated);
  } catch (err) {
    console.error('Error updating property:', err);
    res.status(500).json({ error: 'Failed to update property' });
  }
};

/**
 * Delete property
 * DELETE /properties/:id
 */
export const deleteProperty: RequestHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const property = await Property.findOne({ propertyId: req.params.id });

    if (!property) {
      res.status(404).json({ message: 'Property not found' });
      return;
    }

    if (property.createdBy?.toString() !== user.id) {
      res.status(403).json({ message: 'Not allowed to delete this property' });
      return;
    }

    await property.deleteOne();

    // Invalidate relevant caches
    await CacheService.del(CACHE_KEYS.PROPERTY(req.params.id));
    await CacheService.delByPattern('properties:*');
    await CacheService.delByPattern('search:*');

    res.json({ message: 'Property deleted' });
  } catch (err) {
    console.error('Error deleting property:', err);
    res.status(500).json({ error: 'Failed to delete property' });
  }
};

/**
 * Search query interface
 */
interface SearchQuery {
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  state?: string;
  city?: string;
  minArea?: string;
  maxArea?: string;
  bedrooms?: string;
  bathrooms?: string;
  amenities?: string;
  furnished?: string;
  availableFrom?: string;
  listedBy?: string;
  tags?: string;
  minRating?: string;
  isVerified?: string;
  listingType?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search properties with filters
 * GET /properties/search
 */
export const searchProperties: RequestHandler = async (req: Request<{}, {}, {}, SearchQuery>, res: Response): Promise<void> => {
  try {
    const queryString = JSON.stringify(req.query);
    const cacheKey = CACHE_KEYS.SEARCH(queryString);

    // Try to get from cache first
    const cachedResult = await CacheService.get(cacheKey);
    if (cachedResult) {
      res.json(cachedResult);
      return;
    }

    const {
      type,
      minPrice,
      maxPrice,
      state,
      city,
      minArea,
      maxArea,
      bedrooms,
      bathrooms,
      amenities,
      furnished,
      availableFrom,
      listedBy,
      tags,
      minRating,
      isVerified,
      listingType,
      page = '1',
      limit = '10',
      sortBy = 'price',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter: any = {};

    // Simple filters
    if (type) filter.type = type;
    if (state) filter.state = state;
    if (city) filter.city = city;
    if (bedrooms) filter.bedrooms = parseInt(bedrooms);
    if (bathrooms) filter.bathrooms = parseInt(bathrooms);
    if (furnished) filter.furnished = furnished;
    if (listedBy) filter.listedBy = listedBy;
    if (listingType) filter.listingType = listingType;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    // Range filters
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    if (minArea || maxArea) {
      filter.areaSqFt = {};
      if (minArea) filter.areaSqFt.$gte = parseInt(minArea);
      if (maxArea) filter.areaSqFt.$lte = parseInt(maxArea);
    }

    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }

    if (availableFrom) {
      filter.availableFrom = { $gte: new Date(availableFrom) };
    }

    // Array filters
    if (amenities) {
      const amenitiesList = amenities.split('|');
      filter.amenities = { $all: amenitiesList };
    }

    if (tags) {
      const tagsList = tags.split('|');
      filter.tags = { $all: tagsList };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination and sorting
    const [properties, total] = await Promise.all([
      Property.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Property.countDocuments(filter)
    ]);

    // Get available filter options
    const filterOptions = await getFilterOptions();

    const result = {
      success: true,
      data: {
        properties,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        },
        filterOptions
      }
    };

    // Cache the results
    await CacheService.set(cacheKey, result);

    res.json(result);
  } catch (error) {
    console.error('Search properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching properties',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get available filter options
 * @returns Object containing all available filter options
 */
export const getFilterOptions = async () => {
  try {
    const [
      types,
      states,
      cities,
      furnishedOptions,
      listedByOptions,
      listingTypes,
      amenities,
      tags
    ] = await Promise.all([
      Property.distinct('type'),
      Property.distinct('state'),
      Property.distinct('city'),
      Property.distinct('furnished'),
      Property.distinct('listedBy'),
      Property.distinct('listingType'),
      Property.distinct('amenities'),
      Property.distinct('tags')
    ]);

    return {
      types,
      states,
      cities,
      furnishedOptions,
      listedByOptions,
      listingTypes,
      amenities,
      tags
    };
  } catch (error) {
    console.error('Get filter options error:', error);
    throw error;
  }
};

/**
 * Get filter options endpoint
 * GET /properties/filters
 */
export const getFilterOptionsController: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Try to get from cache first
    const cachedFilters = await CacheService.get(CACHE_KEYS.FILTERS);
    if (cachedFilters) {
      res.json(cachedFilters);
      return;
    }

    const filterOptions = await getFilterOptions();
    const result = {
      success: true,
      data: filterOptions
    };

    // Cache the results
    await CacheService.set(CACHE_KEYS.FILTERS, result);

    res.json(result);
  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting filter options',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
