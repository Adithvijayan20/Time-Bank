const { LocalStorage } = require('node-localstorage');
const path = require('path');
const otpGenerator=require('../services/otpGenrator')
const emailService=require('../services/emailService')
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
const matchFunction=require('../helpers/helper')

//**************************************************************************************************************************************

// **********************volunter home or volunteer job

router.get('/volunteerhome', ensureAuthenticated, checkRole('volunteer'), (req, res) => {
    res.render('volunteerhome', { 
        user: req.session.user, 
        volunteerName: req.session.user.fullName,
        volunteerId: req.session.user._id.toString()
    });
});



router.get('/volunteer-job/:id', async (req, res) => {
    try {
        const volunteerId = req.query.volunteerId || req.session.volunteerId;
        if (!volunteerId) {
            return res.status(400).render('error', { message: "Volunteer ID is required." });
        }

        const availableJobs = await db.get()
            .collection(collection.NOTIFICATIONS_COLLECTION)
            .find({ status: "unread", volunteerId: volunteerId }) // Ensure matching volunteerId
            .toArray();

        if (!availableJobs || availableJobs.length === 0) {
            return res.render('volunteerhome', { availableJobs: [], message: "No new job notifications available." });
        }

        // Fetch patient details
        const patientIds = availableJobs.map(job => new ObjectId(job.patientId));
        const patients = await db.get()
            .collection(collection.USER_COLLECTION)
            .find({ _id: { $in: patientIds } })
            .toArray();

        console.log("🔍 Patients from DB:", patients);

        const patientMap = {};
        patients.forEach(patient => {
            patientMap[patient._id.toString()] = {
                fullName: patient.fullName,
                phone: patient.phone,
                location: patient.latitude && patient.longitude
                    ? {latitude: patient.latitude, longitude: patient.longitude}
                    : { latitude: 11.8356082, longitude:  0}
            };
        });

        const jobsWithPatientDetails = availableJobs.map(job => {
            const patient = patientMap[job.patientId] || {};
            console.log('matte myran',patient);
            
            return {
                ...job,
                patientName: patient.fullName || "Unknown Patient",
                phone: patient.phone || "Not Available",
                location: patient.location
            };
        });
        

        console.log("✅ Processed Job Data:", jobsWithPatientDetails);

        res.render('volunteerhome', { availableJobs: jobsWithPatientDetails });

    } catch (error) {
        console.error("❌ Error fetching job notifications:", error);
        res.status(500).render('error', { message: "Internal Server Error" });
    }
});



//*******************************volunteer srevice 


router.get('/volunteer-service', async (req, res) => {
   // console.log("Session Data:", req.session); // Debugging session data

    if (!req.session.volunteerId) {
        return res.redirect('/login'); // Redirect if session is missing
    }

    try {
        const volunteer = await db.get()
            .collection(collection.USER_COLLECTION)
            .findOne({ _id: new ObjectId(req.session.volunteerId) });

        if (!volunteer) {
            return res.status(404).send("Volunteer not found");
        }

        res.render('volunterService', { fullName: volunteer.fullName, id: volunteer._id });
    } catch (error) {
        console.error("Error fetching volunteer:", error);
        res.status(500).send("Server error");
    }
});


router.post('/volunteer-services', async (req, res) => {
   // console.log("Session Data:", req.session); // Debugging session data

    const volunteerId = req.session.volunteerId; // Retrieve from session
    if (!volunteerId) {
        console.log("Volunteer ID missing in session");
        return res.status(401).send("Unauthorized: Volunteer ID missing");
    }

    try {
        const availableService = await userHelpers.addVolunteerHome({
            ...req.body,
            patientNeeds: Array.isArray(req.body.patientNeeds) 
            ? req.body.patientNeeds 
            : [req.body.patientNeeds],
            volunteerId: new ObjectId(volunteerId) // Ensure it's stored correctly
        });

        console.log("Service added:", availableService);
        res.redirect(`/volunteer-profile/${req.session.volunteerId}`);
    } catch (error) {
        console.error("Error adding service:", error);
        res.status(500).send("Server error");
    }
});





// *********************************volunteer dashboard


// compelet profile


router.post('/volunteer-profile/:id', ensureAuthenticated, upload.single('profileImage'), async (req, res) => {
    console.log('Form submitted with ID:', req.params.id);

    try {
        // Ensure database connection
        const database = db.get();
        if (!database) {
            console.error('Database is not initialized');
            return res.status(500).send('Internal Server Error');
        }

        const volunteerId = new ObjectId(req.params.id);

        // Construct updated profile data
        const updatedData = {
            fullName: req.body.fullName,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            adhar: req.body.adhar,
            dob: req.body.dob,
            latitude: parseFloat(req.body.latitude) || null,
            longitude: parseFloat(req.body.longitude) || null,
        };

        // Handle profile image upload
        if (req.file) {
            updatedData.profileImageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }

        // Update volunteer profile in database
        const result = await database.collection(collection.USER_COLLECTION).updateOne(
            { _id: volunteerId },
            { $set: updatedData }
        );

        if (result.modifiedCount === 0) {
            console.error('No document was updated. Check if the ID exists.');
            return res.status(404).send('Profile not found or no changes made.');
        }

        console.log('Profile updated successfully:', updatedData);
        res.redirect(`/volunteer-profile/${req.params.id}`);

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Error updating profile');
    }
});


router.get('/volunteer-profile/:id', ensureAuthenticated, async (req, res) => {
    try {
        const database = db.get();
        if (!database) {
            console.error('Database is not initialized');
            return res.status(500).send('Internal Server Error');
        }

        const volunteerId = new ObjectId(req.params.id);
        const volunteer = await database.collection(collection.USER_COLLECTION).findOne({ _id: volunteerId });
        
        if (!volunteer) {
            return res.status(404).send('Volunteer not found');
        }

        res.render('volunteer-profile', {
            id: req.params.id,
            title: 'Volunteer Profile',
            appName: 'Volunteer Management System',
            fullName: volunteer.fullName,
            email: volunteer.email,
            phoneNumber: volunteer.phoneNumber,
            address: volunteer.address,
            adhar: volunteer.adhar,
            dob: volunteer.dob,
            profileImageUrl: volunteer.profileImageUrl,
            currentYear: new Date().getFullYear(),
        });
    } catch (error) {
        console.error('Error fetching volunteer profile:', error.message, error.stack);
        res.status(500).send('Error fetching volunteer profile');
    }
});
// Add this new route to handle the Accept action
router.post('/volunteer-job/accept/:id', ensureAuthenticated, async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await db.get()
            .collection(collection.NOTIFICATIONS_COLLECTION)
            .findOne({ _id: new ObjectId(jobId) });

        if (!job) return res.status(404).json({ message: "Job not found" });

        const patient = await db.get()
            .collection(collection.USER_COLLECTION)
            .findOne({ _id: new ObjectId(job.patientId) });

        if (!patient) return res.status(404).json({ message: "Patient not found" });

        const volunteer = req.session.user;
        if (!volunteer) return res.status(401).json({ message: "Volunteer not authenticated" });

        const otp = otpGenerator.otpgenerator();

        const matchDoc = {
            start_otp: otp,
            end_otp: "",
            volunteerName: volunteer.fullName,
            volunteerId: volunteer._id,
            patientId: job.patientId,
            patientEmail: patient.email,
            services: job.services || [],
            location: job.location || patient.location || {},
            isComplete: false,
            createdAt: new Date(),
            startTime: null, // Store start time later
            endTime: null,   // Store end time later
        };

        emailService.serviceStartMail(patient.email, patient.fullName, otp);

        const result = await db.get()
            .collection(collection.MATCHES_COLLECTION)
            .insertOne(matchDoc);

        await db.get()
            .collection(collection.NOTIFICATIONS_COLLECTION)
            .updateOne(
                { _id: new ObjectId(jobId) },
                { $set: { status: "accepted" } }
            );
console.log('testing ',result.insertedId);

        res.redirect(`/start-job/${result.insertedId}`);
    } catch (error) {
        console.error("Error accepting job:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

  //new kunna
  router.post('/volunteer-job/start-job', ensureAuthenticated, async (req, res) => {
    try {
        const { matchId, otp } = req.body;

        const match = await db.get()
            .collection(collection.MATCHES_COLLECTION)
            .findOne({ _id: new ObjectId(matchId) });

        if (!match || match.start_otp !== otp) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        await db.get()
            .collection(collection.MATCHES_COLLECTION)
            .updateOne(
                { _id: new ObjectId(matchId) },
                { $set: { startTime: new Date() } }
            );

        res.json({ success: true });
    } catch (error) {
        console.error("Error verifying start OTP:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

router.post('/volunteer-job/end-job', ensureAuthenticated, async (req, res) => {
    try {
        const { matchId, otp } = req.body;

        const match = await db.get()
            .collection(collection.MATCHES_COLLECTION)
            .findOne({ _id: new ObjectId(matchId) });

        if (!match || match.end_otp !== otp) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        await db.get()
            .collection(collection.MATCHES_COLLECTION)
            .updateOne(
                { _id: new ObjectId(matchId) },
                { $set: { endTime: new Date(), isComplete: true } }
            );

        res.json({ success: true });
    } catch (error) {
        console.error("Error verifying end OTP:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

router.get('/volunteer-job/start/:matchId', ensureAuthenticated, async (req, res) => {
    try {
        const matchId = req.params.matchId;
console.log('evda ethi');

        const match = await db.get()
            .collection(collection.MATCHES_COLLECTION)
            .findOne({ _id: new ObjectId(matchId) });

        if (!match) return res.status(404).send("Match not found");

        res.render('start-job', { match });
    } catch (error) {
        console.error("Error fetching job details:", error);
        res.status(500).send("Internal Server Error");
    }
});



module.exports = router;