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
const User = require('../models/user');
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

router.get('/volunteer-Job', async(req, res) => {
    const availableJob=await db.get().collection(collection.MATCH_COLLECTION).find({active:true}).toArray()
    console.log('available jobs are',availableJob);

   
    res.render('volunteerhome',{availableJob})

    // userHelpers.addVolunteerHome(volunteerData).then((response) => {
    //     console.log(response);
    //     res.redirect('/'); // Redirect back to patient home
    // });
});

//*******************************volunteer srevice 


router.get('/volunteer-services', async(req, res) => {
    // const availableJob=await db.get().collection(collection.MATCH_COLLECTION).find({active:true}).toArray()
    // console.log('available jobs are',availableJob);
    const volunteerId = localStorage.getItem("volunteerId");
    console.log('volunter ',volunteerId);
    
    const volunteer = await db.get()
    .collection(collection.USER_COLLECTION)
    .findOne({ _id: new ObjectId(volunteerId) });
    console.log(volunteer.fullName);
    console.log(volunteer._id);
    
    res.render('volunterService',{fullName:volunteer.fullName,id:volunteer._id})

    // userHelpers.addVolunteerHome(volunteerData).then((response) => {
    //     console.log(response);
    //     res.redirect('/'); // Redirect back to patient home
    // });
});

router.post('/volunteer-services',async (req, res) => {
    console.log('123',req.body);
    const volunteerId = localStorage.getItem("volunteerId");
    console.log(volunteerId);
    
    
    const availableService=await userHelpers.addVolunteerHome({...req.body,volunteerId})
    console.log("available service",availableService);
    res.redirect('/volunteerhome')
    
    // console.log('available jobs are',availableJob);

   
    // res.render('volunteerhome',{availableJob})

    // userHelpers.addVolunteerHome(volunteerData).then((response) => {
    //     console.log(response);
    //     res.redirect('/'); // Redirect back to patient home
    // });
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
            profileImageUrl: volunteer.profileImageUrl,
            currentYear: new Date().getFullYear(),
        });
    } catch (error) {
        console.error('Error fetching volunteer profile:', error.message, error.stack);
        res.status(500).send('Error fetching volunteer profile');
    }
});



module.exports = router;