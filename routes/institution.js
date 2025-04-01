const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkRole } = require('../middleware/auth');
const userHelpers = require('../helpers/user_helpers');
const multer = require('multer');
const path = require('path');
const db = require('../config/connection');
const { getGFS } = require('../config/connection');
const collection = require('../config/collections');
const { ObjectId } = require('mongodb');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'public/uploads/volunteers';
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const fileFilter = function (req, file, cb) {
    if (file.fieldname === "idProof") {
        if (file.mimetype === "image/png" || 
            file.mimetype === "image/jpg" || 
            file.mimetype === "image/jpeg" || 
            file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error('Only .png, .jpg, .jpeg and .pdf format allowed for ID proof!'));
        }
    } else if (file.fieldname === "photo") {
        if (file.mimetype === "image/png" || 
            file.mimetype === "image/jpg" || 
            file.mimetype === "image/jpeg") {
            cb(null, true);
        } else {
            cb(new Error('Only .png, .jpg and .jpeg format allowed for photo!'));
        }
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
});
// Profile routes
router.get('/profile', ensureAuthenticated, checkRole('institution'), async (req, res) => {
    try {
        // Fetch the institution profile from the database
        const InstitutionProfile = await userHelpers.getInstitutionProfile(req.session.user._id);
        
        // Send the profile data to the view
        res.render('institution/profile', { 
            profile: InstitutionProfile,
            institutionName: req.session.user.fullName,
            layout: 'layout' 
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).send('Error loading profile');
    }
});


router.post('/profile/update', ensureAuthenticated, checkRole('institution'), upload.single('profileImage'), async (req, res) => {
    try {
        await userHelpers.updateInstitutionProfile(req.session.user._id, req.body, req.file);
        res.redirect('/institution/profile');
    } catch (error) {
        res.status(500).send('Error updating profile');
    }
});

router.get('/addvolunteers', ensureAuthenticated, checkRole('institution'), async (req, res) => {
    try {
        res.render('institution/addvolunteers', { 
            institutionName: req.session.user.fullName,
            layout: 'layout',
        });
    } catch (error) {
        console.error('Add volunteer error:', error);
        res.status(500).send('Error loading add volunteer form');
    }
});

router.post('/addvolunteers', 
    ensureAuthenticated, 
    checkRole('institution'),
    upload.fields([
        { name: 'idProof', maxCount: 1 },
        { name: 'photo', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const volunteerData = {
                ...req.body,
                idProofPath: req.files['idProof'][0].path.replace('public/', ''),
                photoPath: req.files['photo'][0].path.replace('public/', ''),
                createdAt: new Date(),
                status: 'active',
                role: 'institutional_volunteer'
            };
            const institutionId = req.session.user._id;
            await userHelpers.addInstitutionVolunteers(volunteerData, institutionId);
            res.redirect('/institution/viewvolunteers');
        } catch (error) {
            console.error('Error adding volunteer:', error);
            // req.flash('error', 'Error adding volunteer. Please try again.');
            res.redirect('/institution/addvolunteers');
        }
    }
);

router.get('/viewvolunteers', ensureAuthenticated, checkRole('institution'), async (req, res) => {
    try {
        const institutionId = req.session.user._id;
        const ViewVolunteers = await userHelpers.getViewVolunteersList(institutionId); 
        console.log(ViewVolunteers);
        res.render('institution/viewvolunteers', { 
            viewvolunteers: ViewVolunteers, 
            institutionName: req.session.user.fullName,
            layout: 'layout', 
        });
        
    } catch (err) {
        console.error("Error fetching volunteers: ", err);
        res.status(500).send("Internal Server Error");
    }
});
router.post('/viewvolunteers/delete/:id', ensureAuthenticated, checkRole('institution'), async (req, res) => {
    const volunteerId = req.params.id;
    try {
        await userHelpers.deleteVolunteer(volunteerId);
        return res.redirect('/institution/viewvolunteers');
    } catch (err) {
        console.error("Error deleting volunteer: ", err);
        res.json({ success: false, message: 'Failed to delete volunteer' });
    }
});

router.get('/vieweachvolunteer/:id', ensureAuthenticated, checkRole('institution'), async (req, res) => {
    try {
        const volunteerId = req.params.id; // Get the volunteer ID from the URL parameter
        const viewEachVolunteer = await userHelpers.getViewEachVolunteers(volunteerId); // Pass the volunteer ID to the helper function
        res.render('institution/vieweachvolunteer', { 
            viewEachVolunteer,  // Pass the volunteer data to the view
            institutionName: req.session.user.fullName,
            layout: 'layout',
        });
    } catch (err) {
        console.error("Error fetching volunteer details: ", err);
        res.status(500).send("Internal Server Error");
    }
});
router.get('/updateeachvolunteer/:id', ensureAuthenticated, checkRole('institution'), async (req, res) => {
    try {
        const volunteerId = req.params.id; 
        const viewEachVolunteer = await userHelpers.getUpdateEachVolunteer(volunteerId); 
        res.render('institution/updateeachvolunteer', { 
            viewEachVolunteer,  // Pass the volunteer data to the view
            institutionName: req.session.user.fullName,
            layout: 'layout',
        });
    } catch (err) {
        console.error("Error fetching volunteer details: ", err);
        res.status(500).send("Internal Server Error");
    }
});
router.post('/updateeachvolunteer/:id', ensureAuthenticated, checkRole('institution'), upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'idProof', maxCount: 1 }
]), async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.files) {
            if (req.files.photo) {
                updateData.photoPath = req.files.photo[0].filename;
            }
            if (req.files.idProof) {
                updateData.idProofPath = req.files.idProof[0].filename;
            }
        }
        await userHelpers.postUpdateEachVolunteer(req.params.id, updateData);
        res.redirect('/institution/viewvolunteers');
    } catch (error) {
        console.error("Error updating volunteer:", error);
        res.status(500).send('Error updating volunteer');
    }
});

router.post('/assist/:patientId', ensureAuthenticated, checkRole('institution'), async (req, res) => {
    try {
        await userHelpers.createAssistanceRequest(req.session.user._id, req.params.patientId);
        res.redirect('/institution/assist');
    } catch (error) {
        res.status(500).send('Error creating assistance request');
    }
});

// Rating routes
router.post('/rate/:patientId', ensureAuthenticated, checkRole('institution'), async (req, res) => {
    try {
        await userHelpers.ratePatient(req.params.patientId, req.body.rating, req.body.comment);
        res.redirect('/institution/assist');
    } catch (error) {
        res.status(500).send('Error submitting rating');
    }
});

// Time tracking routes
router.post('/time/start', ensureAuthenticated, checkRole('institution'), async (req, res) => {
    try {
        await userHelpers.startTimeTracking(req.session.user._id, req.body.serviceId);
        res.redirect('/institution/services');
    } catch (error) {
        res.status(500).send('Error starting time tracking');
    }
});

router.post('/time/end', ensureAuthenticated, checkRole('institution'), async (req, res) => {
    try {
        await userHelpers.endTimeTracking(req.session.user._id, req.body.serviceId);
        res.redirect('/institution/services');
    } catch (error) {
        res.status(500).send('Error ending time tracking');
    }
});
router.get('/notifications', ensureAuthenticated, checkRole('institution'), async (req, res) => {
    try {
        const notifications = await userHelpers.getInstitutionNotifications(req.session.user._id);
        const unreadCount = await userHelpers.getUnreadNotificationCount(req.session.user._id);
        
        res.render('institution/notifications', { 
            notifications,
            unreadCount 
        });
    } catch (error) {
        console.error('Error loading notifications:', error);
        res.status(500).render('error', { 
            message: 'Error loading notifications',
            error: error.message 
        });
    }
});

// Notification detail route
router.get('/notifications/:id', ensureAuthenticated, checkRole('institution'), async (req, res) => {
    const notificationId = req.params.id;
    console.log('Accessing notification', notificationId);
    try {
        const notification = await userHelpers.getEachInstiNotifications(notificationId);
        await userHelpers.markNotificationAsRead(notificationId);
        return res.render('institution/notification-detail', { 
            notification,
            notificationId,
            title: 'Notification Details'
        });

    } catch (error) {
        console.error('Error loading notification details:', error, error.stack);
        return res.status(500).render('error', { 
            message: 'Error loading notification details',
            error: error.message 
        });
    }
});
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};
router.get('/assign-volunteer/:requestId', ensureAuthenticated, checkRole('institution'), async (req, res) => {

    try {
        const requestId = req.params.requestId;
        
        // Fetch the notification and patient location
        const notification = await userHelpers.getEachInstiNotifications(requestId);
        const institutionId = req.session.user._id;
        
        const volunteers = await userHelpers.getViewVolunteersList(institutionId);
        
        const patientId = notification.details?.patientId || '';
        const patientUser = await userHelpers.getPatientLocation(patientId);

        if (!patientUser) {
            return res.status(404).render('error', { message: 'Patient not found' });
        }

        const requiredSkills = notification.details?.patientNeeds || [];

        // Calculate match score for each volunteer
        const matchedVolunteers = volunteers.map(volunteer => {
            // Ensure skills are treated as an array
            const volunteerSkills = typeof volunteer.skill === 'string'
                ? volunteer.skill.split(',').map(skill => skill.trim())
                : Array.isArray(volunteer.skill) 
                    ? volunteer.skill 
                    : [];

            // Skill matching logic
            const matchingSkills = volunteerSkills.filter(skill => requiredSkills.includes(skill));
            const skillMatchPercentage = requiredSkills.length > 0
                ? (matchingSkills.length / requiredSkills.length) * 100
                : 0;

            // Distance calculation
            const distance = calculateDistance(
                patientUser.latitude, 
                patientUser.longitude, 
                volunteer.latitude, 
                volunteer.longitude
            );

            // Overall match score: 70% skill match + 30% distance proximity
            const distanceWeight = 30;
            const skillWeight = 70;
            
            const matchScore = (skillMatchPercentage * skillWeight / 100) + 
                               ((1 / (distance + 1)) * distanceWeight);

            return {
                ...volunteer,
                skillsArray: volunteerSkills,
                matchingSkills,
                skillMatchPercentage: Math.round(skillMatchPercentage),
                distance: distance.toFixed(2),
                matchScore: Math.round(matchScore)
            };
        });

        // Sort volunteers by match score (descending)
        matchedVolunteers.sort((a, b) => b.matchScore - a.matchScore);

        res.render('institution/assign-volunteer', {
            notification: {
                ...notification,
                _id: notification._id
            },
            volunteers: matchedVolunteers,
            requiredSkills,
            patientLocation: `${patientUser.latitude}, ${patientUser.longitude}`
        });

    } catch (error) {
        console.error('Error matching volunteers:', error);
        res.status(500).render('error', {
            message: 'Error finding matching volunteers',
            error: error.message
        });
    }
});


// Process the volunteer assignment
router.post('/assign-volunteer', ensureAuthenticated, checkRole('institution'), async (req, res) => {
    try {
        const { requestId, volunteerId, patientId } = req.body;
        
        if (!requestId || !volunteerId) {
            return res.status(400).render('error', { 
                message: 'Missing required fields',
                error: 'Request ID and Volunteer ID are required' 
            });
        }
        
        const notification = await userHelpers.getEachInstiNotifications(requestId);
        if (!notification) {
            return res.status(404).render('error', { 
                message: 'Error assigning volunteer',
                error: 'Request notification not found' 
            });
        }
        
        // Get volunteer details
        const volunteer = await userHelpers.getViewVolunteersList(volunteerId);
        const patientUser = await userHelpers.getPatientLocation(patientId);

        if (!volunteer) {
            return res.status(404).render('error', { 
                message: 'Error assigning volunteer',
                error: 'Volunteer not found' 
            });
        }
        
        // Create assignment record
        const assignment = {
            requestId: new ObjectId(requestId),
            volunteerId: new ObjectId(volunteerId),
            patientId: patientId ? new ObjectId(patientId) : null,
            institutionId: req.session.user._id ? new ObjectId(req.session.user._id) : null,
            requestDetails: notification.details || {},
            status: 'assigned',
            assignedDate: new Date(),
            completedDate: null
        };
        
        // Save to accepted volunteer collection
        const result = await db.get()
            .collection(collection.ACCEPTEDVOLUNTEER_COLLECTION)
            .insertOne(assignment);
            
        // Update notification status
        await db.get()
            .collection(collection.NOTIFICATIONS_COLLECTION)
            .updateOne(
                { _id: new ObjectId(requestId) },
                { $set: { status: 'accepted'} }
            );
        console.log('Assignment successful');
        res.redirect('/institution/notifications?assigned=success');
    } catch (error) {
        console.error('Error assigning volunteer - detailed error:', error);
        
        // Provide more specific error information
        let errorMessage = 'Unknown error occurred';
        if (error.name === 'BSONTypeError') {
            errorMessage = 'Invalid ID format';
        } else if (error.message.includes('collection')) {
            errorMessage = 'Database collection error';
        }
        
        res.status(500).render('error', { 
            message: 'Error assigning volunteer',
            error: errorMessage 
        });
    }
});
router.get('/activeServices', ensureAuthenticated, checkRole('institution'), async (req, res) => {
    try {
        const institutionId = req.session.user._id;
        const activeServicesList = await userHelpers.getActiveServicesList(institutionId);
        for (const service of activeServicesList) {
            if (service.volunteerId) {
                service.volunteerName = await userHelpers.getVolunteerName(service.volunteerId);
            } else {
                service.volunteerName = 'No Volunteer Assigned';
            }
        }
        res.render('institution/activeServices', { 
            institutionName: req.session.user.fullName,
            activeServicesList,
            helpers: {
                // This helper is available in the template
                getVolunteerName: async function(volunteerId) {
                    return await userHelpers.getVolunteerName(volunteerId);
                }
            },
            layout: 'layout',
        });
    } catch (error) {
        console.error('Add volunteer error:', error);
        res.status(500).send('Error loading Active Services list');
    }
});

router.get('/service-details/:id', ensureAuthenticated, checkRole('institution'), async (req, res) => {
    try {
        const eachServiceDetailsId = req.params.id; 
        const ServiceDetails = await userHelpers.getEachServiceDetails(eachServiceDetailsId); 
        res.render('institution/service-details', { 
            ServiceDetails,  
            institutionName: req.session.user.fullName,
            layout: 'layout',
        });
    } catch (err) {
        console.error("Error fetching Service Details: ", err);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
