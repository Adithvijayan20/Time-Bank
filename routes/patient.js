const { LocalStorage } = require('node-localstorage');

// Initialize localStorage
const path = require('path');

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


    // *******************************************patient logout ****************************************





module.exports = router;