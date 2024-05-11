const mongoose = require('mongoose');

// Define schema
const locationSchema = new mongoose.Schema({
    name: String,
    geometry: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true }
    }
});
// Create 2dsphere index
locationSchema.index({ geometry: '2dsphere' });

// Create model
module.exports = mongoose.model('Location', locationSchema);

