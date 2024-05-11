const express = require('express');
const axios = require('axios');
const morgan = require('morgan');
const dotenv=require('dotenv')
const mongoose = require('mongoose');
const Location=require('./models/locationModel')
const app = express();
dotenv.config();
const PORT = process.env.PORT || 3000;


//conect to db
const URL = process.env.DB_URI;

mongoose.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log("db connected");
}).catch((err) => {
    console.error("Error connecting to database:", err);
});


app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



// API endpoint to create a location
app.post('/locations', async (req, res) => {
    try {
        const { name, latitude, longitude } = req.body;
        const newLocation = new Location({
            name: name,
            geometry: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            }
        });
        const savedLocation = await newLocation.save();
        res.json(savedLocation);
    } catch (error) {
        console.error("Error creating location:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to get all locations
app.get('/locations', async (req, res) => {
    try {
        const locations = await Location.find();
        res.json(locations);
    } catch (error) {
        console.error("Error getting locations:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// API endpoint to get nearest locations
app.get('/locations/near', async (req, res) => {
    try {
        const { latitude, longitude, maxDistance } = req.query;

        if (!latitude || !longitude || !maxDistance) {
            return res.status(400).json({ error: 'Latitude, longitude, and maxDistance are required query parameters.' });
        }

        const locations = await Location.find({
            geometry: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(maxDistance) * 1000 // Convert maxDistance to meters 
                }
            }
        });

        res.json(locations);
    } catch (error) {
        console.error("Error getting nearest locations:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// API endpoint to find nearest location
app.post('/nearest-location', async (req, res) => {
    const {  query } = req.body;

    try {
        
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
            params: {
                key: process.env.API_KEY,
                query: query,
                type:"restaurant",
                radius: 5000
            }
        });

        if (response.data.status !== 'OK') {
            throw new Error('Google Places API returned an error');
        }

        const nearbyLocations = response.data.results.map(place => ({
            name: place.name,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
        }));

        res.json(nearbyLocations);
    } catch (error) {
        console.error('Error fetching nearby locations:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
