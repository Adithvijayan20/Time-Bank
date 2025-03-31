const { LocalStorage } = require('node-localstorage');

// Initialize localStorage
const path = require('path');
 const twilio = require('twilio');
 require('dotenv').config();
// Use a directory within your project or a temporary directory
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
const getPatientVolunteerMatches = require('../helpers/helper'); // Ensure the correct path
 const bcrypt = require('bcrypt')


const { ObjectId } = require('mongodb');
const { Collection } = require('mongoose');
const axios = require('axios'); // Import Axios
const cheerio = require('cheerio');
//const User = require('../models/user');
const matchFunction=require('../helpers/helper')
//**************************************************************************************************************************************

//**************patient registration 

router.post('/patient', upload.single('idUpload'), async (req, res) => {
    try {
        // Pass form data and uploaded file to userHelpers
        req.body.role = req.body.role || 'patient';
        await userHelpers.doSignup(req.body, req.file);
        res.redirect('/login'); // Redirect to login page upon success
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).send('An error occurred during signup. Please try again.');
    }
});

//************************************patient home


// router.get('/patienthome', ensureAuthenticated, checkRole('patient'), (req, res) => {
//     const patientId = new ObjectId(req.params.id);
//     res.render('patienthome/'${req.params.id}, { 
//         user: req.session.user, 
//         patientName: req.session.user.fullName,
//         patientId: req.session.user._id.toString() // Ensure it's a string
//     });
// });

router.get('/patienthome/:id', ensureAuthenticated, checkRole('patient'), (req, res) => {
    const patientId = req.params.id; 
    
    console.log('id',patientId);
    
    // Get patient ID from URL

    res.render('patienthome', {  // Render the correct existing template
        user: req.session.user, 
        patientName: req.session.user.fullName,
        patientId: patientId // Keep it as a string
    });
});






//*****************************************patient dashboard 


router.get('/patient-profile/:id', ensureAuthenticated, async (req, res) => {
    try {
        const database = db.get();
        if (!database) {
            console.error('Database is not initialized');
            return res.status(500).send('Internal Server Error');
        }

        const patientId = new ObjectId(req.params.id);
        const patient = await database.collection(collection.USER_COLLECTION).findOne({ _id: patientId });
        
        if (!patient) {
            return res.status(404).send('patient not found');
        }

       
        res.render('patient-profile', {
            id: req.params.id,
            title: 'patient Profile',
            appName: 'patient Management System',
            fullName: patient.fullName,
            email: patient.email,
            phoneNumber: patient.phoneNumber,
            address: patient.address,
            dob: patient.dob,
            gender: patient.gender,
            adhar:patient.adhar,
           
            profileImageUrl: patient.profileImageUrl,
            currentYear: new Date().getFullYear(),
        });
    } catch (error) {
        console.error('Error fetching volunteer profile:', error.message, error.stack);
        res.status(500).send('Error fetching volunteer profile');
    }
});


//********************************************patient complete profile


router.post('/patient-profile/:id', ensureAuthenticated, upload.single('profileImage'), async (req, res) => {
    console.log('Form submitted with ID:', req.params.id);

    try {
        // Ensure database connection
        const database = db.get();
        if (!database) {
            console.error('Database is not initialized');
            return res.status(500).send('Internal Server Error');
        }

        const patientId = new ObjectId(req.params.id);

        // Construct updated profile data
        const updatedData = {
            fullName: req.body.fullName,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            adhar: req.body.adhar,
            latitude: parseFloat(req.body.latitude) || null,
            longitude: parseFloat(req.body.longitude) || null,
        };

        // Handle profile image upload
        if (req.file) {
            updatedData.profileImageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }

        // Update volunteer profile in database
        const result = await database.collection(collection.USER_COLLECTION).updateOne(
            { _id: patientId },
            { $set: updatedData }
        );

        if (result.modifiedCount === 0) {
            console.error('No document was updated. Check if the ID exists.');
            return res.status(404).send('Profile not found or no changes made.');
        }

        console.log('Profile updated successfully:', updatedData);
        console.log('thi sis new test',patientId);
        console.log('thi sis id',req.params.id);
        
        res.redirect(`/patient-profile/${req.params.id}`);

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Error updating profile');
    }
});

//**********************************patient srevice 

router.post('/patient-services', async (req, res) => {
    // Normalize patientNeeds to always be an array
    const normalizedPatientNeeds = Array.isArray(req.body.patientNeeds)
        ? req.body.patientNeeds
        : [req.body.patientNeeds];

    // Build patientData and include currentPatientNeeds field.
    const patientData = {
        ...req.body,
        patientNeeds: normalizedPatientNeeds,         // May hold historic values
          // New field for the latest requested needs
        patientId: req.session.user._id                   // Attach unique patient ID from session
    };

    console.log("Patient Data:", patientData);

    // Update (or add) the patient record. (Ensure that userHelpers.addPatientHome performs an upsert.)
    await userHelpers.addPatientHome(patientData);

    // Create matching details for later processing
    const matchDetails = {
        patientName: patientData.patientName,
        patientId: patientData.patientId,
        work: normalizedPatientNeeds,
        date: patientData.date,
        time: patientData.time,
        active: true,
        volunteerName: "",
        volunteerId: ""
    };

    const matchedValue = await userHelpers.addMatching(matchDetails);
    console.log('Matched details:', matchedValue);

    // Redirect to the nearest-volunteers page using the patientId
    res.redirect(`/nearest-volunteers/${patientData.patientId}`);
});


    // *******************************************rating****************************************


    


    async function getCompletedWorkDetails(patientId) {
        try {
            // Fetch all completed matches for the given patientId
            const completedMatches = await Match.find({ patientId, isComplete: true });
    
            if (!completedMatches.length) {
                console.log("No completed work found for this patient.");
                return [];
            }
    
            // Extract volunteer names
            const volunteerNames = completedMatches.map(match => match.volunteerName);
            
            // Print volunteer names
            console.log("Volunteers who completed work:", volunteerNames);
    
            // Return match details
            return completedMatches;
        } catch (error) {
            console.error("Error fetching completed work details:", error);
            return [];
        }
    }




// *************************
// GET route to list completed matches (volunteers) for rating
// GET route to list unrated completed matches (volunteers) for rating
router.get('/patient-rating/:id', ensureAuthenticated, checkRole('patient'), async (req, res) => {
    try {
        const patientId = req.params.id;
        const database = db.get();
        if (!database) {
            console.error('Database is not initialized');
            return res.status(500).send('Internal Server Error');
        }
        // Fetch completed matches for this patient from the matches collection
        const completedMatches = await database.collection(collection.MATCH_COLLECTION)
            .find({ patientId: patientId, isComplete: true })
            .toArray();
        
        // Fetch all ratings that have been stored for this patient from the rating collection
        const ratedRatings = await database.collection(collection.RATING_COLLECTION)
            .find({ patientId: patientId })
            .toArray();
        
        // Extract matchIds from rated records and convert them to strings for comparison
        const ratedMatchIds = ratedRatings.map(r => r.matchId.toString());
        
        // Filter out matches that already have a rating
        const unratedMatches = completedMatches.filter(match => !ratedMatchIds.includes(match._id.toString()));
        
        // Render the view with only unrated matches
        res.render('rating', { 
            patientId,
            completedMatches: unratedMatches
        });
    } catch (error) {
        console.error('Error fetching completed matches for rating:', error);
        res.status(500).send('Error fetching ratings');
    }
});


// POST route to submit a rating for a specific match record
// router.post('/rate-volunteer/:matchId', ensureAuthenticated, checkRole('patient'), async (req, res) => {
//     try {
//         const matchId = req.params.matchId;
//         const ratingValue = Number(req.body.rating);
//         if (isNaN(ratingValue)) {
//             console.error('Invalid rating value:', req.body.rating);
//             return res.status(400).send('Invalid rating value.');
//         }
        
//         const database = db.get();
//         if (!database) {
//             console.error('Database is not initialized');
//             return res.status(500).send('Internal Server Error');
//         }
        
//         console.log(`Fetching match record for matchId: ${matchId}`);
//         const matchRecord = await database.collection(collection.MATCH_COLLECTION)
//             .findOne({ _id: new ObjectId(matchId) });
//         if (!matchRecord) {
//             console.error(`Match record not found for matchId: ${matchId}`);
//             return res.status(404).send('Match record not found.');
//         }
        
//         // Build the rating object in the desired format
//         const ratingData = {
//             rating: ratingValue,
//             volunteerName: matchRecord.volunteerName,
//             volunteerId: matchRecord.volunteerId,
//             patientName: req.session.user.fullName,
//             patientId: req.session.user._id,
//             matchId: new ObjectId(matchId),
//             createdAt: new Date()
//         };
        
//         console.log("Inserting rating data into collection:", ratingData);
        
//         // Insert the rating data into the new ratings collection
//         const result = await database.collection(collection.RATING_COLLECTION).insertOne(ratingData);
//         console.log("Insert result:", result);
        
//         if (!result.insertedId) {
//             console.error('No insertedId returned, rating was not stored.');
//             return res.status(500).send('Rating not stored');
//         }
        
//         console.log('Rating stored successfully with ID:', result.insertedId);
//         res.redirect(`/patient-profile/${req.session.user._id}`);
//     } catch (error) {
//         console.error('Error storing rating:', error);
//         res.status(500).send('Error storing rating');
//     }
// });




router.post('/rate-volunteer/:matchId', ensureAuthenticated, checkRole('patient'), async (req, res) => {
    try {
        const matchId = req.params.matchId;
        const ratingValue = Number(req.body.rating);
        if (isNaN(ratingValue)) {
            console.error('Invalid rating value:', req.body.rating);
            return res.status(400).send('Invalid rating value.');
        }
        
        const database = db.get();
        if (!database) {
            console.error('Database is not initialized');
            return res.status(500).send('Internal Server Error');
        }
        
        // Check if a rating already exists for this match
        const existingRating = await database.collection(collection.RATING_COLLECTION)
            .findOne({ matchId: new ObjectId(matchId) });
        if (existingRating) {
            console.log('Rating already exists for this match. Not storing again.');
            return res.redirect(`/patient-profile/${req.session.user._id}`);
        }
        
        console.log(`Fetching match record for matchId: ${matchId}`);
        const matchRecord = await database.collection(collection.MATCH_COLLECTION)
            .findOne({ _id: new ObjectId(matchId) });
        if (!matchRecord) {
            console.error(`Match record not found for matchId: ${matchId}`);
            return res.status(404).send('Match record not found.');
        }
        
        // Build the rating object in the desired format
        const ratingData = {
            rating: ratingValue,
            volunteerName: matchRecord.volunteerName,
            volunteerId: matchRecord.volunteerId,
            patientName: req.session.user.fullName,
            patientId: req.session.user._id,
            matchId: new ObjectId(matchId),
            createdAt: new Date()
        };
        
        console.log("Inserting rating data into collection:", ratingData);
        
        // Insert the rating data into the new ratings collection
        const result = await database.collection(collection.RATING_COLLECTION).insertOne(ratingData);
        console.log("Insert result:", result);
        
        if (!result.insertedId) {
            console.error('No insertedId returned, rating was not stored.');
            return res.status(500).send('Rating not stored');
        }
        
        console.log('Rating stored successfully with ID:', result.insertedId);
        res.redirect(`/patient-profile/${req.session.user._id}`);
    } catch (error) {
        console.error('Error storing rating:', error);
        res.status(500).send('Error storing rating');
    }
});

// ****************************************************************
// ✅ Declare environment variables FIRST
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error("Twilio credentials are missing! Check your .env file.");
  process.exit(1);
}

const client = twilio(accountSid, authToken);

// Modified emergency call function to include patient details with phone digits
async function makeEmergencyCall(patientName, patientPhoneDigits) {
  try {
    const twimlMessage = `<Response>
      <Say voice='alice'>
        Emergency alert:this is time bank srevice Patient ${patientName} with phone number ${patientPhoneDigits} requires assistance. Please respond immediately.
      </Say>
    </Response>`;

    const call = await client.calls.create({
      twiml: twimlMessage,
      to: "+916282085045", // Ensure it's in E.164 format; this is the emergency contact number
      from: twilioPhoneNumber,
    });

    console.log(`Call initiated successfully! Call SID: ${call.sid}`);
    return { sid: call.sid, status: "in-progress" };
  } catch (error) {
    console.error("Error making emergency call:", error.message);
    throw error;
  }
}

// Protect the emergency-call route so session data is available (e.g., using ensureAuthenticated)
router.post('/emergency-call', ensureAuthenticated, async (req, res) => {
  try {
    // Get patient details from session (ensure these fields exist on your user model)
    const patientName = req.session.user.fullName;
    const patientPhone = req.session.user.phoneNumber;

    // Convert the phone number into individual digits separated by spaces (e.g., "1 2 3 ..." instead of words)
    const patientPhoneDigits = patientPhone.split('').join(' ');

    // Initiate the emergency call with modified phone number
    await makeEmergencyCall(patientName, patientPhoneDigits);

    // After the call, redirect back to the patient profile page
    res.redirect(`/patient-profile/${req.session.user._id}`);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error making emergency call." });
  }
});




module.exports = router;