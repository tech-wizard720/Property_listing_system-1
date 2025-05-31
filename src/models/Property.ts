import mongoose, { Schema, Document } from 'mongoose';

/**
 * Property Interface
 * Defines the structure of a property document
 */
export interface IProperty extends Document {
  propertyId: string;          // Unique identifier for the property
  title: string;               // Property title
  type: string;                // Type of property (e.g., Bungalow, Apartment)
  price: number;               // Property price
  state: string;               // State where property is located
  city: string;                // City where property is located
  areaSqFt: number;            // Area in square feet
  bedrooms: number;            // Number of bedrooms
  bathrooms: number;           // Number of bathrooms
  amenities: string[];         // List of amenities
  furnished: 'Furnished' | 'Unfurnished' | 'Semi';  // Furnishing status
  availableFrom: Date;         // Date from which property is available
  listedBy: 'Builder' | 'Owner' | 'Agent';  // Who listed the property
  tags: string[];              // Property tags
  colorTheme: string;          // UI color theme
  rating: number;              // Property rating
  isVerified: boolean;         // Whether property is verified
  listingType: 'rent' | 'sale'; // Type of listing
  createdBy?: mongoose.Types.ObjectId;  // Reference to user who created
}

/**
 * Property Schema
 * Defines the structure and validation rules for properties
 */
const PropertySchema: Schema = new Schema({
  propertyId: { 
    type: String, 
    required: true, 
    unique: true,
    default: function() {
      return 'PROP' + Math.floor(1000 + Math.random() * 9000);
    }
  },
  title: { type: String, required: true },
  type: { type: String, required: true },
  price: { type: Number, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  areaSqFt: { type: Number, required: true },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  amenities: [{ type: String }],
  furnished: { 
    type: String, 
    required: true,
    enum: ['Furnished', 'Unfurnished', 'Semi']
  },
  availableFrom: { type: Date, required: true },
  listedBy: { 
    type: String, 
    required: true,
    enum: ['Builder', 'Owner', 'Agent']
  },
  tags: [{ type: String }],
  colorTheme: { type: String, required: true },
  rating: { type: Number, required: true },
  isVerified: { type: Boolean, required: true },
  listingType: { 
    type: String, 
    required: true,
    enum: ['rent', 'sale']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt fields
});

// Create indexes for frequently filtered fields to improve query performance
PropertySchema.index({ propertyId: 1 });
PropertySchema.index({ type: 1 });
PropertySchema.index({ state: 1 });
PropertySchema.index({ city: 1 });
PropertySchema.index({ price: 1 });
PropertySchema.index({ areaSqFt: 1 });
PropertySchema.index({ bedrooms: 1 });
PropertySchema.index({ bathrooms: 1 });
PropertySchema.index({ furnished: 1 });
PropertySchema.index({ listedBy: 1 });
PropertySchema.index({ listingType: 1 });
PropertySchema.index({ rating: 1 });
PropertySchema.index({ isVerified: 1 });
PropertySchema.index({ createdBy: 1 });

export default mongoose.model<IProperty>('Property', PropertySchema);
