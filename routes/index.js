

// module.exports = router;
//role based

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

const matchFunction=require('../helpers/helper')

router.get('/volunteer-profile-update', (req, res) => {
    res.render('volunteer-profile-update', { title: 'Express' });
});

router.get('/', (req, res) => {
    res.render('home', { title: 'Express' });
});
    router.get('/admin', (req, res) => {
        res.render('admin', { title: 'Express' });
});
router.get('/reg', function(req, res, next) {
    
  res.render('reg', { title: 'Express' });
});
// 
router.get('/patient', (req, res) => {
    res.render('patient', { title: 'Patient Registration' });
});


router.get('/signup', (req, res) => {
    res.render('index', { title: 'Express' });
});
router.get('/matches', (req, res) => {
    res.render('matches', { title: 'Express' });
});
//old
// router.post('/signup',upload.single('idUpload'), async (req, res) => {
//     req.body.role = req.body.role || 'volunteer'; // Assign role dynamically
//     await userHelpers.doSignup(req.body,req.file);
  
//     res.redirect('/login');
// });
//old
router.post('/signup', upload.single('idUpload'), async (req, res) => {
    try {
        // Pass form data and uploaded file to userHelpers
        req.body.role = req.body.role || 'volunteer';
        await userHelpers.doSignup(req.body, req.file);
        res.redirect('/login'); // Redirect to login page upon success
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).send('An error occurred during signup. Please try again.');
    }
});
//new patient

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




//old
// router.post('/patient', async (req, res) => {
//     req.body.role = req.body.role || 'patient'; // Assign role dynamically
//     await userHelpers.doSignup(req.body);
//     res.redirect('/login');
// });
//old
router.get('/login', (req, res) => {
    res.render('login', { title: 'Express' });
});

// router.post('/login', async (req, res) => {
//     try {
//         const loginResponse = await userHelpers.doLogin(req.body);
//         if (loginResponse.status) {
//             req.session.loggedIn = true;
//             req.session.user = loginResponse.user;
//             res.redirect(loginResponse.user.role === 'volunteer' ? '/volunteerhome' : '/patienthome');
//         } else {
//             res.status(401).send('Login failed');
//         }
//     } catch (error) {
//         res.status(500).send('Error during login');
//     }
// });
//add for session
// router.post('/login', async (req, res) => {
//     try {
//         const loginResponse = await userHelpers.doLogin(req.body);
//         if (loginResponse.status) {
//             req.session.loggedIn = true;
//             req.session.user = loginResponse.user;
//             res.redirect(loginResponse.user.role === 'volunteer' ? '/volunteerdsh' : '/patienthome');
//         } else {
//             res.status(401).send('Login failed');
//         }
//     } catch (error) {
//         res.status(500).send('Error during login');
//     }
// });




//including admin role

router.post('/login', async (req, res) => {
    try {
        const loginResponse = await userHelpers.doLogin(req.body);
        if (loginResponse.status) {
            req.session.loggedIn = true;
            req.session.user = loginResponse.user;

            // Check for user roles and redirect accordingly
            if (loginResponse.user.role === 'volunteer') {
                localStorage.setItem("volunteerId",loginResponse.user._id)
                res.redirect(`/volunteer-profile/${loginResponse.user._id}`);
            } else if (loginResponse.user.role === 'patient') {
                localStorage.setItem("patientId",`${loginResponse.user._id}`)
                res.redirect(`/patient-profile/${loginResponse.user._id}`);
            } else if (loginResponse.user.role === 'admin') {
                res.redirect('/admin');
                 // Redirect to admin dashboard
            } else {
                res.status(400).send('Invalid user role');
            }
        } else {
            res.status(401).send('Login failed');
        }
    } catch (error) {
        console.log(error.message);
        
        res.status(500).send('Error during login');
    }
});



// **Protected Routes**
//old
// router.get('/volunteerhome', ensureAuthenticated, checkRole('volunteer'), (req, res) => {
//     res.render('volunteerhome', { user: req.session.user });
// });

// router.get('/patienthome', ensureAuthenticated, checkRole('patient'), (req, res) => {
//     res.render('patienthome', { user: req.session.user });
// });
//added for session
// router.get('/patienthome', ensureAuthenticated, checkRole('patient'), (req, res) => {
//     res.render('patienthome', { user: req.session.user, patientName: req.session.user.fullName });
// });
//old
// router.get('/patienthome', ensureAuthenticated, checkRole('patient'), (req, res) => {
//     const uniquePatientId = req.session.user._id; // Using MongoDB ObjectId
//     res.render('patienthome', { 
//         user: req.session.user, 
//         patientName: req.session.user.fullName,
//         patientId: uniquePatientId // Pass unique ID to the template
//     });
// });
// router.get('/volunteerhome', ensureAuthenticated, checkRole('volunteer'), (req, res) => {
//     const uniquevolunteerId = req.session.user._id; // Using MongoDB ObjectId
//     res.render('volunteerhome', { 
//         user: req.session.user, 
//         volunteerName: req.session.user.fullName,
//         volunteerId: uniquevolunteerId // Pass unique ID to the template
//     });
// });
router.get('/patienthome', ensureAuthenticated, checkRole('patient'), (req, res) => {
    res.render('patienthome', { 
        user: req.session.user, 
        patientName: req.session.user.fullName,
        patientId: req.session.user._id.toString() // Ensure it's a string
    });
});
//important
router.get('/volunteerhome', ensureAuthenticated, checkRole('volunteer'), (req, res) => {
    res.render('volunteerhome', { 
        user: req.session.user, 
        volunteerName: req.session.user.fullName,
        volunteerId: req.session.user._id.toString()
    });
});

// Logout route
router.post('/logout', (req, res) => {
    // Destroy the session or handle logout logic
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).send('Logout failed');
            }
            res.redirect('/'); // Redirect to the login page after logout
        });
    } else {
        res.redirect('/'); // Redirect even if no session exists
    }
});


//old
//adding srevice
// router.post('/volunteer-services', async (req, res) => {
//     //req.body.role = req.body.role || 'volunteer'; // Assign role dynamically
//     await userHelpers.addVolunteerHome(req.body);
//     res.redirect('/home');
//});
// router.post('/volunteer-services',(req,res)=>{
//           userHelpers.addVolunteerHome(req.body).then((response)=>{
//            console.log(response);
//            res.redirect('/');
//           })
//         })
//old
router.get('/volunteer-Job', async(req, res) => {
    const availableJob=await db.get().collection(collection.MATCH_COLLECTION).find({active:true}).toArray()
    console.log('available jobs are',availableJob);

   
    res.render('volunteerhome',{availableJob})

    // userHelpers.addVolunteerHome(volunteerData).then((response) => {
    //     console.log(response);
    //     res.redirect('/'); // Redirect back to patient home
    // });
});
router.get('/volunteer-services', async(req, res) => {
    // const availableJob=await db.get().collection(collection.MATCH_COLLECTION).find({active:true}).toArray()
    // console.log('available jobs are',availableJob);
    const volunteerId = localStorage.getItem("volunteerId");
    console.log('volunter mandam',volunteerId);
    
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
    console.log('andi',req.body);
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

        router.post('/patient-services',async (req, res) => {
            const patientData = {
                ...req.body,
                patientId: req.session.user._id // Attach unique patient ID
            };
        // console.log('sameple data',patientData);
        
            userHelpers.addPatientHome(patientData).then((response) => {
                console.log(response);
               // Redirect back to patient home
            });
            console.log(patientData);
            
            const matchDetails={
                patientName:patientData.patientName,
                patientId:patientData.patientId,
                work:patientData.patientNeeds,
                date:patientData.date,
                time:patientData.time,
                active:true,
                volunteerName:"",
                volunteerId:""
                
            }
          const matchedValue=  await userHelpers.addMatching(matchDetails)
          console.log('matched details',matchedValue);
          res.redirect(`/patient-profile/${ patientData.patientId}`)
          
        });
// router.post('/patient-services', (req, res) => {
//     const patientData = {
//         ...req.body,
//         patientId: req.session.user._id,
//         patientNeeds: Array.isArray(req.body.patientNeeds) ? req.body.patientNeeds : [req.body.patientNeeds] // Ensure array format
//     };

//     userHelpers.addPatientHome(patientData).then(() => {
//         res.redirect('/patienthome');
//     });
// });

// router.post('/volunteer-services', (req, res) => {
//     const volunteerData = {
//         ...req.body,
//         volunteerId: req.session.user._id,
//         volunteerServices: Array.isArray(req.body.volunteerServices) ? req.body.volunteerServices : [req.body.volunteerServices]
//     };

//     userHelpers.addVolunteerHome(volunteerData).then(() => {
//         res.redirect('/volunteerhome');
//     });
// });

//matching function


// router.get('/matches', async (req, res) => {
//     try {
//         const matches = await getPatientVolunteerMatches();
//         console.log("Fetched Matches:", matches); // Debugging
//         res.render('matches', { matches }); // Ensure matches are passed to the template
//     } catch (err) {
//         console.error('Error retrieving matches:', err);
//         res.status(500).send('Server Error');
//     }
// });
// router.get('/matches', async (req, res) => {
//     try {
//         const matches = await db.get().collection(collection.MATCH_COLLECTION).find().toArray();
//         res.render('matches', { matches });
//     } catch (err) {
//         console.error('Error fetching match details:', err);
//         res.status(500).send('Internal Server Error');
//     }
// });

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

//Route to view individual patient details
router.get('/view-patient/:id', ensureAuthenticated, checkRole('admin'), async (req, res) => {
    try {
        // Fetch the patient using their unique ID
        const patient = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: req.params.id });
        res.render('view-patient', { 
            title: 'Patient Profile',
            patient,
            appName: 'Patient Registration System',
            currentYear: new Date().getFullYear()
        });
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).send('Error fetching patient details');
    }
});






// Route to delete a patient (Admin)
// router.get('/delete-patient/:id', ensureAuthenticated, checkRole('admin'), async (req, res) => {
//     try {
//         await db.get().collection(collection.USER_COLLECTION).deleteOne({ _id: req.params.id });
//         res.redirect('/manage-patients'); // Redirect to manage patients page after deletion
//     } catch (error) {
//         console.error('Error deleting patient:', error);
//         res.status(500).send('Error deleting patient');
//     }
// });
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
//admin 
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



//volunteer management

// Route to render the Manage Volunteers page
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
//volunteer dashboard
// In app.js or the appropriate routes file


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
// In your route handler

// Example route handler
// Backend Route for volunteerhome





//for updating the profile page
// Route to handle profile update
// Volunteer Profile Update Route

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

// Volunteer profile update route



// router.post('/volunteer-profile/:id', ensureAuthenticated, upload.single('profileImage'), async (req, res) => {
//     console.log('Form submitted with ID:', req.params.id);

//     try {
//         const database = db.get();
//         if (!database) {
//             console.error('Database is not initialized');
//             return res.status(500).send('Internal Server Error');
//         } 
//         const volunteerId = new ObjectId(req.params.id);
//         const updatedData = {
//             fullName: req.body.fullName,
//             email: req.body.email,
//             phoneNumber: req.body.phoneNumber,
//             address: req.body.address,
//             adhar: req.body.adhar,
//             profileImageUrl: req.file ? req.file.path : req.body.profileImageUrl
//         };

//         if (req.file) {
//             updatedData.profileImageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
//         }
        

//         const result = await database.collection(collection.USER_COLLECTION).updateOne(
//             { _id: volunteerId },
//             { $set: updatedData }
//         );

//         if (result.modifiedCount === 0) {
//             console.error('No document updated');
//             return res.status(404).send('Profile not found');
//         }

//         res.redirect(`/volunteer-profile/${req.params.id}`);
//     } catch (error) {
//         console.error('Error updating profile:', error);
//         res.status(500).send('Error updating profile');
//     }
// });
// (`/volunteer-profile/${loginResponse.user._id}`)




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


//patient complete profile
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
        res.redirect(`/patient-profile/${req.params.id}`);

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Error updating profile');
    }
});

//patient complete profile
// Get match details by ID
// router.get('/match/:id', async (req, res) => {
//     try {
//         const database = db.get(); // Assuming `db.get()` initializes your database connection
//         if (!database) {
//             console.error('Database is not initialized');
//             return res.status(500).send('Internal Server Error');
//         }

//         const matchId = new ObjectId(req.params.id);
//         //const match = await database.collection('matches').findOne({ _id: matchId });
//          const match = await database.collection(collection.MATCH_COLLECTION).findOne({ _id: matchId });

//         if (!match) {
//             return res.status(404).send('Match not found');
//         }

//         // Render the match details using the Handlebars template
//         res.render('match-details', {
//             id: req.params.id,
//             volunteerName: match.volunteerName,
//             patientName: match.patientName,
//             matchDate: match.matchDate,
//             matchStatus: match.matchStatus,
//             notes: match.notes || 'No additional notes',
//             currentYear: new Date().getFullYear(),
//         });
//     } catch (error) {
//         console.error('Error fetching match details:', error.message, error.stack);
//         res.status(500).send('Error fetching match details');
//     }
// });
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
//webscraping
async function fetchElderlyNews() {
    try {
        const url = 'https://www.manoramaonline.com/';
        const response = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        let allHeadlines = [];

        // Collect all headlines, no filtering yet
        $('.story-card a, article a, .news-item a, h2 a, h3 a').each((index, element) => {
            let text = $(element).text().trim();
            if (text.length > 5) { // Reduce minimum length to see more
                allHeadlines.push(text);
            }
        });

        console.log("📰 ALL HEADLINES:", allHeadlines); // Log all headlines

        return allHeadlines; // Return everything for testing
    } catch (error) {
        console.error("❌ Error fetching news:", error.message);
        return [];
    }
}

// Route to render elderly news page
router.get('/elderly-news', async (req, res) => {
    const elderlyNews = await fetchElderlyNews();
    console.log("🔎 Sending headlines to template:", elderlyNews); // Debugging log
    res.render('elderly-news', { headlines: elderlyNews.length ? elderlyNews : ["No elderly news found!"] });
});


const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.manoramaonline.com/', { waitUntil: 'networkidle2' });

    // Get full page content after JS loads
    const content = await page.content();
    const cheerio = require('cheerio');
    const $ = cheerio.load(content);

    let headlines = [];
    $('article a, .story-card a, h2 a, h3 a').each((index, element) => {
        let text = $(element).text().trim();
        if (text.length > 10) {
            headlines.push(text);
        }
    });

    console.log("📰 Filtered News Headlines for Elderly:", headlines.length ? headlines : "❌ No relevant news found!");
    await browser.close();
})();
//chat bot

// Chatbot Function
router.post("/chat", async (req, res) => {
    const userMessage = req.body.message.toLowerCase();
    let response = "I'm not sure. Can you rephrase?";

    // Rule-based responses
    if (userMessage.includes("hello")) {
        response = "Hello! How can I assist you with Time Bank?";
    } else if (userMessage.includes("register")) {
        response = "To register as a volunteer or patient, visit the signup page.";
    } else if (userMessage.includes("volunteer")) {
        response = "Volunteers can offer time-based services. Do you want to register?";
    } else if (userMessage.includes("patient")) {
        response = "Patients can request services from volunteers. Need help signing up?";
    }

    // Save to MongoDB
    await Message.insertOne({ user: "User", message: userMessage, response, timestamp: new Date() });

    res.json({ reply: response });
});

// Chatbot UI Route
router.get("/chat", async (req, res) => {
    const chatHistory = await Message.find().sort({ timestamp: -1 }).limit(10).toArray();
    res.render("chat", { chatHistory });
});
//chat bot

module.exports = router;

