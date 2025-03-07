const { LocalStorage } = require('node-localstorage');
const path = require('path');
const localStorage = new LocalStorage(path.join(__dirname, 'localStorage'));
var express = require('express');
var router = express.Router();
const multer = require('multer');
const userHelpers = require('../helpers/user_helpers');
const db = require('../config/connection');
const { getGFS } = require('../config/connection');
const collection = require('../config/collections');
const { ensureAuthenticated, checkRole } = require('../middleware/auth');
const upload = multer({ storage: multer.memoryStorage() });
const getPatientVolunteerMatches = require('../helpers/helper'); 
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb');
const { Collection } = require('mongoose');
const axios = require('axios'); 
const cheerio = require('cheerio');
//const User = require('../models/user');
const { routes } = require('../app');
//******************************************************************************************



router.get('/update-match/:id', async (req, res) => {
    try {
        const id = req.params.id; // Get match ID from the URL
        const volunteerId = localStorage.getItem("volunteerId");

        if (!volunteerId) {
            console.log('Volunteer ID not found in localStorage');
            return res.status(400).json({ error: "Volunteer ID not found in localStorage" });
        }

        console.log('Volunteer ID found:', volunteerId);

        const volunteerInfo = await db.get()
            .collection(collection.USER_COLLECTION)
            .findOne({ _id: new ObjectId(volunteerId) });

        if (!volunteerInfo) {
            return res.status(404).json({ error: "Volunteer not found" });
        }

        const updatedJob = await db.get()
            .collection(collection.MATCH_COLLECTION)
            .updateOne(
                { _id: new ObjectId(id) }, // Match document by ID
                {
                    $set: {
                        active: false,
                        volunteerId: volunteerId,
                        volunteerName: volunteerInfo.fullName,
                    },
                }
            );

        console.log('Update Result:', updatedJob);

        if (updatedJob.matchedCount === 0) {
            return res.status(404).json({ error: "Match not found" });
        }

        res.json({ message: "Match updated successfully", updatedJob });
    } catch (err) {
        console.error("Error updating match:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Route to render matches
router.get('/matches', async (req, res) => {
    try {
        // Fetch matches from the database
        const matches = await db.get().collection(collection.MATCH_COLLECTION).find().toArray();
        console.log('Fetched matches:', matches); // Debugging to check data

        // Render the 'matches' template and pass the matches to it
        res.render('matches', { match: matches }); // Ensure 'match' key matches with template expectation
    } catch (err) {
        console.error('Error fetching match details:', err);
        res.status(500).send('Internal Server Error'); // Send 500 if error occurs
    }

});



router.get('/match-details/:id', async (req, res) => {
    try {

        console.log("id is here",req.params.id);
        
        const database = db.get(); // Assuming `db.get()` initializes your database connection
        if (!database) {
            console.error('Database is not initialized');
            return res.status(500).send('Internal Server Error');
        }

        console.log('Requested Match ID:', req.params.id);

        // Validate ObjectId format
        if (!ObjectId.isValid(req.params.id)) {
            console.error('Invalid ID format:', req.params.id);
            return res.status(400).send('Invalid ID format');
        }

        const matchId = new ObjectId(req.params.id);
        const data=await matchFunction.getPatientVolunteerMatches(req.params.id)
        console.log('data in router',data);
        
        // res.json({data})
        // const match = await database.collection(collection.MATCH_COLLECTION).findOne({ _id: matchId });

        // if (!match) {
        //     console.error('No match found for ID:', req.params.id);
        //     return res.status(404).send('Match not found');
        // }

        // // Render the match details using the Handlebars template
        res.render('match-details',{data});
    } catch (error) {
        console.error('Error fetching match details:', error.message, error.stack);
        res.status(500).send('Error fetching match details');
    }
});





module.exports=router;