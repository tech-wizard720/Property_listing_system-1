import fs from 'fs';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Property from '../models/Property';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || '')
  .then(() => {
    console.log('MongoDB connected');
    importCSV();
  })
  .catch(err => console.error(err));

function importCSV() {
  const results: any[] = [];

  fs.createReadStream('./data/properties.csv') // save your CSV here
    .pipe(csv())
    .on('data', (data) => {
        results.push({
            propertyId: data.id, // ✅ using 'propertyId' now
            title: data.title,
            type: data.type,
            price: Number(data.price),
            state: data.state,
            city: data.city,
            areaSqFt: Number(data.areaSqFt),
            bedrooms: Number(data.bedrooms),
            bathrooms: Number(data.bathrooms),
            amenities: data.amenities ? data.amenities.split('|') : [],
            furnished: data.furnished,
            availableFrom: data.availableFrom,
            listedBy: data.listedBy,
            tags: data.tags ? data.tags.split('|') : [],
            colorTheme: data.colorTheme,
            rating: Number(data.rating),
            isVerified: data.isVerified.toLowerCase() === 'true',
            listingType: data.listingType,
            createdBy: null,
          });
          
    })
    .on('end', async () => {
      try {
        await Property.insertMany(results);
        console.log('CSV data imported');
        process.exit();
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    });
}
