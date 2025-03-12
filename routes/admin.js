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
const session = require('express-session');
const flash = require('express-flash');
//const User = require('../models/user');
//***************************************************************************************** 
// Handle admin registration
router.get('/admin-register', (req, res) => {
    res.render('adminorg', { title: 'Express' });
}),
router.post('/admin-register', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Hash the password before saving to DB
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save admin user to DB
        await db.get().collection(collection.USER_COLLECTION).insertOne({
            email,
            password: hashedPassword,
            role: role || 'admin'  // Ensure 'admin' role is assigned
        });

        res.redirect('/admin-login'); // Redirect to admin login after successful registration
    } catch (error) {
        console.error('Error during admin registration:', error);
        res.status(500).send('An error occurred during registration. Please try again.');
    }
});

//*************************************************volunteer management



router.get('/view-volunteer/:id', ensureAuthenticated, checkRole('admin'), async (req, res) => {
    try {
        const volunteer = await db
            .get()
            .collection(collection.USER_COLLECTION)
            .findOne({ _id: new ObjectId(req.params.id) });

        if (!volunteer) {
            return res.status(404).send('Volunteer not found');
        }

        // Convert fileBuffer to base64 if idUpload exists
        let uploadedFileBase64 = null;
        if (volunteer.idUpload && volunteer.idUpload.fileBuffer) {
            uploadedFileBase64 = `data:${volunteer.idUpload.fileType};base64,${volunteer.idUpload.fileBuffer.toString('base64')}`;
        }

        res.render('view-volunteer', {
            title: 'Volunteer Profile',
            volunteer,
            uploadedFileBase64, // Pass the base64 file to the template
            appName: 'Volunteer Registration System',
            currentYear: new Date().getFullYear(),
        });
    } catch (error) {
        console.error('Error fetching volunteer:', error);
        res.status(500).send('Error fetching volunteer details');
    }
});


router.get('/manage-volunteers',ensureAuthenticated, checkRole('admin'),  async (req, res) => {
    try {
        // Fetch all volunteers from the database
        const volunteers = await db.get().collection(collection.USER_COLLECTION).find({ role: 'volunteer' }).toArray();
        
        res.render('manage-volunteers', { 
            title: 'Manage Volunteers',
            volunteers,
            appName: 'Volunteer Registration System',
            currentYear: new Date().getFullYear()
        });
    } catch (error) {
        console.error('Error fetching volunteers:', error);
        res.status(500).send('Error fetching volunteers');
    }
});

// Route to delete a volunteer by ID
router.get('/delete-volunteer/:id', ensureAuthenticated, checkRole('admin'), async (req, res) => {
    try {
        const volunteerId = new ObjectId(req.params.id);  // Use new ObjectId() to create the ID
        await db.get().collection(collection.USER_COLLECTION).deleteOne({ _id: volunteerId });
        res.redirect('/manage-volunteers'); // Redirect to manage volunteers page after deletion
    } catch (error) {
        console.error('Error deleting volunteer:', error);
        res.status(500).send('Error deleting volunteer');
    }
});
router.post('/toggle-activation/:id', ensureAuthenticated, checkRole('admin'), async (req, res) => {
    try {
        const userId = req.params.id;
        const volunteer = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: new ObjectId(userId) });

        if (!volunteer) {
            req.flash('error', 'User not found');
            return res.redirect('/manage-volunteers');
        }

        const newStatus = !volunteer.isActive; // Toggle the status
        await db.get().collection(collection.USER_COLLECTION).updateOne(
            { _id: new ObjectId(userId) },
            { $set: { isActive: newStatus } }
        );

        req.flash('success', `User ${newStatus ? 'activated' : 'deactivated'} successfully.`);
        res.redirect(`/view-volunteer/${userId}`); // Reload the volunteer profile page
    } catch (error) {
        console.error('Error updating activation status:', error);
        req.flash('error', 'Error updating user status.');
        res.redirect(`/view-volunteer/${req.params.id}`);
    }
});



//**************************************** patient manage


router.get('/delete-patient/:id', ensureAuthenticated, checkRole('admin'), async (req, res) => {
    try {
        const patientId = req.params.id;

        // Ensure that the ID is a valid ObjectId before querying
        if (!ObjectId.isValid(patientId)) {
            return res.status(400).send('Invalid patient ID');
        }

        await db.get().collection(collection.USER_COLLECTION).deleteOne({ _id: new ObjectId(patientId) });

        res.redirect('/manage-patients'); // Redirect to manage patients page after deletion
    } catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).send('Error deleting patient');
    }
});
router.get('/manage-patients', ensureAuthenticated, checkRole('admin'), async (req, res) => {
    try {
        // Querying the MongoDB database to get all patients with role "patient"
        const patients = await db.get().collection(collection.USER_COLLECTION).find({ role: 'patient' }).toArray();
        res.render('manage-patients', { 
            title: 'Manage Patients',
            patients,
            appName: 'Patient Registration System',
            currentYear: new Date().getFullYear() 
        });
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).send('Error fetching patients');
    }
});
//*********************************view patient


router.get('/view-patient/:id', ensureAuthenticated, checkRole('admin'), async (req, res) => {
    try {
        const patient = await db
            .get()
            .collection(collection.USER_COLLECTION)
            .findOne({ _id: new ObjectId(req.params.id) });

        if (!patient) {
            return res.status(404).send('Volunteer not found');
        }

        // Convert fileBuffer to base64 if idUpload exists
        let uploadedFileBase64 = null;
        if (patient.idUpload && patient.idUpload.fileBuffer) {
            uploadedFileBase64 = `data:${patient.idUpload.fileType};base64,${patient.idUpload.fileBuffer.toString('base64')}`;
        }

        res.render('view-patient', {
            title: 'patient Profile',
            patient,
            uploadedFileBase64, // Pass the base64 file to the template
            appName: 'patient Registration System',
            currentYear: new Date().getFullYear(),
        });
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).send('Error fetching patient details');
    }
});
router.post('/toggle-activationn/:id', ensureAuthenticated, checkRole('admin'), async (req, res) => {
    try {
        const userId = req.params.id;
        const patient = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: new ObjectId(userId) });

        if (!patient) {
            req.flash('error', 'User not found');
            return res.redirect('/manage-patient');
        }

        const newStatus = !patient.isActive; // Toggle the status
        await db.get().collection(collection.USER_COLLECTION).updateOne(
            { _id: new ObjectId(userId) },
            { $set: { isActive: newStatus } }
        );

        req.flash('success', `User ${newStatus ? 'activated' : 'deactivated'} successfully.`);
        res.redirect(`/view-patient/${userId}`); // Reload the volunteer profile page
    } catch (error) {
        console.error('Error updating activation status:', error);
        req.flash('error', 'Error updating user status.');
        res.redirect(`/view-patient/${req.params.id}`);
    }
});

module.exports=router;