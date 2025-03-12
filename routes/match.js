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



// router.get('/update-match/:id', async (req, res) => {
//     try {
//         const id = req.params.id; // Get match ID from the URL
//         const volunteerId = localStorage.getItem("volunteerId");

//         if (!volunteerId) {
//             console.log('Volunteer ID not found in localStorage');
//             return res.status(400).json({ error: "Volunteer ID not found in localStorage" });
//         }

//         console.log('Volunteer ID found:', volunteerId);

//         const volunteerInfo = await db.get()
//             .collection(collection.USER_COLLECTION)
//             .findOne({ _id: new ObjectId(volunteerId) });

//         if (!volunteerInfo) {
//             return res.status(404).json({ error: "Volunteer not found" });
//         }

//         const updatedJob = await db.get()
//             .collection(collection.MATCH_COLLECTION)
//             .updateOne(
//                 { _id: new ObjectId(id) }, // Match document by ID
//                 {
//                     $set: {
//                         active: false,
//                         volunteerId: volunteerId,
//                         volunteerName: volunteerInfo.fullName,
//                     },
//                 }
//             );

//         console.log('Update Result:', updatedJob);

//         if (updatedJob.matchedCount === 0) {
//             return res.status(404).json({ error: "Match not found" });
//         }

//         res.json({ message: "Match updated successfully", updatedJob });
//     } catch (err) {
//         console.error("Error updating match:", err);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

// // Route to render matches
// router.get('/matches', async (req, res) => {
//     try {
//         // Fetch matches from the database
//         const matches = await db.get().collection(collection.MATCH_COLLECTION).find().toArray();
//         console.log('Fetched matches:', matches); // Debugging to check data

//         // Render the 'matches' template and pass the matches to it
//         res.render('matches', { match: matches }); // Ensure 'match' key matches with template expectation
//     } catch (err) {
//         console.error('Error fetching match details:', err);
//         res.status(500).send('Internal Server Error'); // Send 500 if error occurs
//     }

// });



// router.get('/match-details/:id', async (req, res) => {
//     try {

//         console.log("id is here",req.params.id);
        
//         const database = db.get(); // Assuming `db.get()` initializes your database connection
//         if (!database) {
//             console.error('Database is not initialized');
//             return res.status(500).send('Internal Server Error');
//         }

//         console.log('Requested Match ID:', req.params.id);

//         // Validate ObjectId format
//         if (!ObjectId.isValid(req.params.id)) {
//             console.error('Invalid ID format:', req.params.id);
//             return res.status(400).send('Invalid ID format');
//         }

//         const matchId = new ObjectId(req.params.id);
//         const data=await matchFunction.getPatientVolunteerMatches(req.params.id)
//         console.log('data in router',data);
        
//         // res.json({data})
//         // const match = await database.collection(collection.MATCH_COLLECTION).findOne({ _id: matchId });

//         // if (!match) {
//         //     console.error('No match found for ID:', req.params.id);
//         //     return res.status(404).send('Match not found');
//         // }

//         // // Render the match details using the Handlebars template
//         res.render('match-details',{data});
//     } catch (error) {
//         console.error('Error fetching match details:', error.message, error.stack);
//         res.status(500).send('Error fetching match details');
//     }
// });
// *****************************************************************************************************


// Route to update match for the selected volunteer
// router.get('/update-match/:volunteerId', async (req, res) => {
//     try {
//         if (!req.session.user || req.session.user.role !== 'patient') {
//             console.log("❌ Unauthorized: No patient logged in");
//             return res.status(403).json({ error: "Unauthorized: No patient logged in" });
//         }

//         const volunteerId = new ObjectId(req.params.volunteerId);
//         const patientId = new ObjectId(req.session.user._id);

//         console.log("🔹 Patient ID:", patientId);
//         console.log("🔹 Selected Volunteer ID:", volunteerId);

//         // Check if patient already has an active match
//         const existingMatch = await db.get().collection(collection.MATCH_COLLECTION).findOne({
//             patientId: patientId,
//             active: true
//         });

//         // Fetch volunteer and patient details
//         const volunteer = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: volunteerId });
//         const patient = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: patientId });

//         if (!volunteer || !patient) {
//             console.log("❌ Volunteer or Patient not found.");
//             return res.status(404).json({ error: "Volunteer or Patient not found" });
//         }

//         if (existingMatch) {
//             // ✅ Update existing match
//             const updateResult = await db.get().collection(collection.MATCH_COLLECTION).updateOne(
//                 { _id: existingMatch._id },
//                 {
//                     $set: {
//                         volunteerId: volunteerId,
//                         volunteerName: volunteer.fullName,
//                         status: "Pending Volunteer Confirmation",
//                         updatedAt: new Date()
//                     }
//                 }
//             );

//             if (updateResult.modifiedCount > 0) {
//                 console.log("✅ Match updated successfully.");
//                 return res.json({ redirect: "/patienthome" }); // Send JSON response
//             } else {
//                 console.log("❌ Failed to update match.");
//                 return res.status(500).json({ error: "Failed to update match" });
//             }
//         } else {
//             // ✅ Create a new match
//             const newMatch = {
//                 patientId: patientId,
//                 patientName: patient.fullName,
//                 volunteerId: volunteerId,
//                 volunteerName: volunteer.fullName,
//                 status: "Pending Volunteer Confirmation",
//                 active: true,
//                 createdAt: new Date()
//             };

//             const matchResult = await db.get().collection(collection.MATCH_COLLECTION).insertOne(newMatch);

//             if (!matchResult.insertedId) {
//                 console.log("❌ Failed to create match.");
//                 return res.status(500).json({ error: "Failed to create match" });
//             }

//             console.log(`✅ Match successfully created with ID: ${matchResult.insertedId}`);
//             return res.json({ redirect: "/patienthome" }); // Send JSON response
//         }

//     } catch (err) {
//         console.error("⚠️ Error updating match:", err);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });
router.get("/patienthome/:id",(req,res)=>{
    res.render("patienthome")
})
router.get('/update-match/:volunteerId/:patientId', async (req, res) => {
    try {
      // 1) Check if patient is logged in
      if (!req.session.user || req.session.user.role !== 'patient') {
        console.log("❌ Unauthorized: No patient logged in");
        return res.status(403).json({ error: "Unauthorized: No patient logged in" });
      }
   
      // 2) Parse patient ID from session
      //    We'll ignore volunteerId because we want volunteer fields empty
      const patientUserId = new ObjectId(req.session.user._id);
      console.log("🔹 Patient User ID:", patientUserId);
  
      // 3) Fetch the patient from USER_COLLECTION to verify it exists
      const patientUser = await db.get().collection(collection.USER_COLLECTION).findOne({
        _id: patientUserId,
        role: "patient"
      });
  
      if (!patientUser) {
        console.log("❌ Patient user not found in USER_COLLECTION");
        return res.status(404).json({ error: "Patient not found" });
      }
  
      // 4) Fetch the corresponding patient document from PATIENT_COLLECTION
      //    This is where your "patientName", "patientNeeds", "date", etc. live
      const patientDoc = await db.get().collection(collection.PATIENT_COLLECTION).findOne({
        patientId: patientUserId.toString()
      });
  
      if (!patientDoc) {
        console.log("❌ Patient document not found in PATIENT_COLLECTION");
        return res.status(404).json({ error: "Patient not found in patient table" });
      }
  
      // 5) Check if patient already has an active match
      const existingMatch = await db.get().collection(collection.MATCH_COLLECTION).findOne({
        patientId: patientUserId,
        active: true
      });
  
      // 6) Build the match object with volunteer fields empty
      const matchData = {
        patientName: patientDoc.patientName || patientDoc.fullName || "",
        patientId: patientDoc.patientId || patientUserId.toString(),
        work: Array.isArray(patientDoc.patientNeeds)
          ? patientDoc.patientNeeds.join(", ")
          : "",
        date: patientDoc.date || "",
        time: patientDoc.time || "",
        active: false,
        volunteerName: "",
        volunteerId: ""
      };
  
      // 7) If match exists, update; otherwise create new
      if (existingMatch) {
        console.log("ℹ️ Found existing match for patient:", existingMatch._id);
  
        const updateResult = await db.get().collection(collection.MATCH_COLLECTION).updateOne(
          { _id: existingMatch._id },
          { $set: matchData }
        );
  console.log('this is updated result',updateResult);
  
//         if (updateResult.modifiedCount > 0) {
//           console.log("✅ Existing match updated successfully.");
//           alert("✅  match request send successfully")
//         //   console.log( ` this si a myran /patienthome/${req.params.id}`);
          
//         //   return res.json({ message: "Match updated successfully", redirect: `/patienthome/${req.params.id}`});
//         console.log(` this si a myran /patienthome/${req.session.user._id}`);
// return res.json({ message: "Match updated successfully", redirect: `/patienthome/${req.session.user._id}`});
if (updateResult.modifiedCount > 0) {
    console.log(`✅ Match updated successfully. Redirecting to /patienthome/${req.session.user._id}`);
    return res.json({ 
      message: "Match updated successfully", 
      redirect: `/patienthome/${req.session.user._id}` 
    });

        } else {
          console.log("❌ Failed to update existing match.");
          return res.status(500).json({ error: "Failed to update match" });
        }
      } else {
        console.log("ℹ️ No existing match. Creating a new match...");
  
        const insertResult = await db.get().collection(collection.MATCH_COLLECTION).insertOne(matchData);
  
        if (!insertResult.insertedId) {
          console.log("❌ Failed to create match.");
          return res.status(500).json({ error: "Failed to create match" });
        }
  
        console.log("✅ New match created with ID:", insertResult.insertedId);
       // res.redirect(`/patient-profile/${req.params.id}` )
        return res.json({ message: "Match created successfully", redirect: `/patient-profile/${req.params.id}` });
      }
  
    } catch (err) {
      console.error("⚠️ Error updating match:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
// Route to fetch all matches
router.get('/matches', async (req, res) => {
    try {
        // Fetch matches from the database
        const matches = await db.get().collection(collection.MATCH_COLLECTION).find().toArray();
        console.log('✅ Fetched matches:', matches); // Debugging to check data

        // Render the 'matches' template and pass the matches to it
        res.render('matches', { match: matches }); // Ensure 'match' key matches with template expectation
    } catch (err) {
        console.error('❌ Error fetching match details:', err);
        res.status(500).send('Internal Server Error'); // Send 500 if error occurs
    }
});

// Route to fetch match details by ID
router.get('/match-details/:id', async (req, res) => {
    try {
        console.log("🔹 Requested Match ID:", req.params.id);

        const database = db.get();
        if (!database) {
            console.error('❌ Database is not initialized');
            return res.status(500).send('Internal Server Error');
        }

        // Validate ObjectId format
        if (!ObjectId.isValid(req.params.id)) {
            console.error('❌ Invalid ID format:', req.params.id);
            return res.status(400).send('Invalid ID format');
        }

        const matchId = new ObjectId(req.params.id);
        const data = await matchFunction.getPatientVolunteerMatches(req.params.id);

        if (!data) {
            console.log('❌ No match found for this ID.');
            return res.status(404).send('Match not found');
        }

        console.log('✅ Data fetched for match-details:', data);

        res.render('match-details', { data });

    } catch (error) {
        console.error('⚠️ Error fetching match details:', error.message, error.stack);
        res.status(500).send('Error fetching match details');
    }
});





//********************************************************************

// const haversineDistance = (lat1, lon1, lat2, lon2) => {
//     const toRadians = (deg) => (deg * Math.PI) / 180;
//     const R = 6371; // Earth's radius in km

//     const dLat = toRadians(lat2 - lat1);
//     const dLon = toRadians(lon2 - lon1);
//     const a = 
//         Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//         Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
//         Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c; // Distance in km
// };


// Function to calculate distance between two coordinates using Haversine Formula
// const calculateDistance = (lat1, lon1, lat2, lon2) => {
//     const toRadians = (degree) => degree * (Math.PI / 180);

//     const R = 6371; // Radius of Earth in km
//     const dLat = toRadians(lat2 - lat1);
//     const dLon = toRadians(lon2 - lon1);
    
//     const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//               Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
//               Math.sin(dLon / 2) * Math.sin(dLon / 2);
              
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c; // Distance in km
// };

//Route to get volunteers near a patient
// router.get('/nearest-volunteers/:patientId', async (req, res) => {
//     try {
//         const patientId = req.params.patientId;

//         // Fetch patient details
//         const patient = await db.get().collection(collection.USER_COLLECTION).findOne(
//             { _id: new ObjectId(patientId), role: "patient", latitude: { $exists: true }, longitude: { $exists: true } }
//         );

//         if (!patient) {
//             return res.status(404).render('error', { message: "Patient not found or location missing" });
//         }

//         console.log("Patient Location:", patient.latitude, patient.longitude);
        

        

//         // Fetch all volunteers with valid location data
//         const volunteers = await db.get().collection(collection.USER_COLLECTION).find({
//             role: "volunteer",
//             latitude: { $exists: true },
//             longitude: { $exists: true }
//         }).toArray();

//         if (volunteers.length === 0) {
//             return res.render('error', { message: "No volunteers found with location data" });
//         }

//         // Calculate distances
//         const sortedVolunteers = volunteers.map(volunteer => {
//             return {
//                 ...volunteer,
//                 distance: calculateDistance(patient.latitude, patient.longitude, volunteer.latitude, volunteer.longitude)
//             };
//         }).sort((a, b) => a.distance - b.distance); // Sort by distance

//        // console.log("Sorted Volunteers:", sortedVolunteers);

//         // Render the page with sorted volunteers
//         res.render('nearest-volunteers', { volunteers: sortedVolunteers, patient });
//     } catch (err) {
//         console.error("Error fetching volunteers:", err);
//         res.status(500).render('error', { message: "Internal Server Error" });
//     }
// });


// router.get('/nearest-volunteers/:patientId', async (req, res) => {
//     try {
//         const patientId = req.params.patientId;

//         // Fetch patient details from PATIENT_COLLECTION
//         const patient = await db.get().collection(collection.PATIENT_COLLECTION).findOne({
//             patientId: patientId
//         });

//         if (!patient) {
//             return res.status(404).render('error', { message: "Patient not found" });
//         }

//         console.log("Patient Needs:", patient.patientNeeds);

//         // Ensure patientNeeds is a valid array
//         if (!Array.isArray(patient.patientNeeds) || patient.patientNeeds.length === 0) {
//             return res.render('error', { message: "Patient needs data is missing or in incorrect format" });
//         }

//         // Fetch patient's location from USER_COLLECTION
//         const patientUser = await db.get().collection(collection.USER_COLLECTION).findOne({
//             _id: new ObjectId(patientId),
//             role: "patient",
//             latitude: { $exists: true },
//             longitude: { $exists: true }
//         });

//         if (!patientUser) {
//             return res.status(404).render('error', { message: "Patient location not found" });
//         }

//         console.log("Patient Location:", patientUser.latitude, patientUser.longitude);

//         // Fetch all volunteers from VOLUNTEER_COLLECTION
//         const volunteers = await db.get().collection(collection.VOLUNTEER_COLLECTION).find().toArray();

//         if (volunteers.length === 0) {
//             return res.render('error', { message: "No volunteers found" });
//         }

//         console.log("Total Volunteers Retrieved:", volunteers.length);

//         // Filter volunteers based on matching `patientNeeds`
//         console.log('these are volunteers ',volunteers);
        
//         const matchedVolunteers = volunteers.filter(volunteer => {
//             if (!Array.isArray(volunteer.patientNeeds)) {
//                 console.warn("Skipping volunteer due to invalid patientNeeds:", volunteer);
//                 return false;
//             }
//             console.log("this is a test", volunteer.patientNeeds.some(need => patient.patientNeeds.includes(need)))
//             return volunteer.patientNeeds.some(need => patient.patientNeeds.includes(need));
//         });
// console.log('this is matched volunteer',matchedVolunteers);

//         if (matchedVolunteers.length === 0) {
//             return res.render('error', { message: "No volunteers match the required services" });
//         }

//         console.log("Filtered Volunteers:", matchedVolunteers.length);

//         // Fetch volunteers' locations from USER_COLLECTION
//         const volunteersWithLocation = await Promise.all(matchedVolunteers.map(async (volunteer) => {
//             const volunteerUser = await db.get().collection(collection.USER_COLLECTION).findOne({
//                 _id: new ObjectId(volunteer.volunteerId.$oid),
//                 role: "volunteer",
//                 latitude: { $exists: true },
//                 longitude: { $exists: true }
//             });

//             if (!volunteerUser) {
//                 console.warn("Skipping volunteer with missing location:", volunteer.volunteerId);
//                 return null;
//             }
// console.log('thi is new test samanm',{...volunteer,
//     latitude: volunteerUser.latitude,
//     longitude: volunteerUser.longitude,
//     distance: calculateDistance(patientUser.latitude, patientUser.longitude, volunteerUser.latitude, volunteerUser.longitude)});

//             return {
//                 ...volunteer,
//                 latitude: volunteerUser.latitude,
//                 longitude: volunteerUser.longitude,
//                 distance: calculateDistance(patientUser.latitude, patientUser.longitude, volunteerUser.latitude, volunteerUser.longitude)
//             };
//         }));
        
//         // Remove null values and sort by distance
//         console.log('this si test kunna',volunteersWithLocation);
//         const finalSortedVolunteers = volunteersWithLocation.filter(v => v !== null).sort((a, b) => a.distance - b.distance);
//         console.log('this si sorted kunna',finalSortedVolunteers);

//         console.log("Final Sorted Volunteers:", finalSortedVolunteers.map(v => ({ id: v.volunteerId, distance: v.distance })));

//         // Render the page with sorted volunteers
//         res.render('nearest-volunteers', { volunteers: finalSortedVolunteers, patient });

//     } catch (err) {
//         console.error("Error fetching volunteers:", err);
//         res.status(500).render('error', { message: "Internal Server Error" });
//     }
// });

// // Function to calculate distance between two coordinates (Haversine formula)
// function calculateDistance(lat1, lon1, lat2, lon2) {
//     const toRadians = (degree) => degree * (Math.PI / 180);

//     const R = 6371; // Earth's radius in km
//     const dLat = toRadians(lat2 - lat1);
//     const dLon = toRadians(lon2 - lon1);
    
//     const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//               Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
//               Math.sin(dLon / 2) * Math.sin(dLon / 2);
              
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c; // Distance in km
// }
router.get('/nearest-volunteers/:id', async (req, res) => {
    try {
        const patientId = req.params.id;

        // Fetch patient medical details
        const patient = await db.get().collection(collection.PATIENT_COLLECTION).findOne({ patientId });

        if (!patient) {
            return res.status(404).render('error', { message: "Patient not found" });
        }

        // 🔹 Fetch patient fullName from USER_COLLECTION
        const patientUser = await db.get().collection(collection.USER_COLLECTION).findOne({
            _id: new ObjectId(patientId),
            role: "patient",
            latitude: { $exists: true, $ne: null },
            longitude: { $exists: true, $ne: null }
        });

        if (!patientUser) {
            return res.status(404).render('error', { message: "Patient location not found" });
        }

        // ✅ Assign fullName to patient object
        patient.fullName = patientUser.fullName;

        console.log("✅ Patient Name:", patient.fullName); // Debugging

        if (!Array.isArray(patient.patientNeeds) || patient.patientNeeds.length === 0) {
            return res.render('error', { message: "Patient needs data is missing or incorrect" });
        }

        // Fetch all volunteers
        const volunteers = await db.get().collection(collection.VOLUNTEER_COLLECTION).find().toArray();

        if (volunteers.length === 0) {
            return res.render('error', { message: "No volunteers found" });
        }

        // Filter volunteers based on matching `patientNeeds`
        const matchedVolunteers = volunteers.filter(volunteer => 
            Array.isArray(volunteer.patientNeeds) &&
            volunteer.patientNeeds.some(need => patient.patientNeeds.includes(need))
        );

        if (matchedVolunteers.length === 0) {
            return res.render('error', { message: "No volunteers match the required services" });
        }

        // Fetch volunteers' locations
        const volunteersWithLocation = await Promise.all(matchedVolunteers.map(async (volunteer) => {
            let volunteerId = volunteer.volunteerId;

            try {
                const volunteerUser = await db.get().collection(collection.USER_COLLECTION).findOne({
                    _id: new ObjectId(volunteerId),
                    role: "volunteer",
                    latitude: { $exists: true, $ne: null },
                    longitude: { $exists: true, $ne: null }
                });

                if (!volunteerUser) {
                    return null;
                }

                return {
                    ...volunteer,
                    latitude: volunteerUser.latitude,
                    longitude: volunteerUser.longitude,
                    address: volunteerUser.address,
                    phoneNumber: volunteerUser.phoneNumber,
                    profilePic: volunteerUser.profileImageUrl,
                    fullName: volunteerUser.fullName,
                    volunteerId: volunteerUser._id.toString(),
                    patientId: patientUser._id.toString(),
                    distance: calculateDistance(patientUser.latitude, patientUser.longitude, volunteerUser.latitude, volunteerUser.longitude) // ✅ Now defined!
                };
            } catch (error) {
                console.error(`Error fetching location for volunteerId: ${volunteerId}`, error);
                return null;
            }
        }));

        const finalSortedVolunteers = volunteersWithLocation.filter(v => v !== null).sort((a, b) => a.distance - b.distance);

        if (finalSortedVolunteers.length === 0) {
            return res.render('error', { message: "No nearby volunteers found." });
        }

        // ✅ Pass correct patient name to Handlebars
        res.render('nearest-volunteers', { volunteers: finalSortedVolunteers, patient });

    } catch (err) {
        console.error("Error fetching volunteers:", err);
        res.status(500).render('error', { message: "Internal Server Error" });
    }
});

// 📌 Function to calculate distance (ADD THIS TO FIX THE ERROR)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRadians = (degree) => degree * (Math.PI / 180);
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}



// router.get('/nearest-volunteers/:patientId', async (req, res) => {
//     try {
//         const patientId = req.params.patientId;

//         // Fetch patient details from the "patients" collection
//         const patient = await db.get().collection(collection.PATIENT_COLLECTION).findOne({
//             patientId: patientId
//         });

//         if (!patient) {
//             return res.status(404).render('error', { message: "Patient not found" });
//         }

//         console.log("Patient Needs:", patient.patientNeeds); // Debugging output

//         // Ensure patientNeeds is an array
//         if (!Array.isArray(patient.patientNeeds) || patient.patientNeeds.length === 0) {
//             return res.render('error', { message: "Patient needs data is missing or incorrect format" });
//         }

//         // Fetch patient location from the USER_COLLECTION
//         const patientUser = await db.get().collection(collection.USER_COLLECTION).findOne({
//             _id: new ObjectId(patientId),
//             role: "patient",
//             latitude: { $exists: true },
//             longitude: { $exists: true }
//         });

//         if (!patientUser) {
//             return res.status(404).render('error', { message: "Patient location not found" });
//         }

//         console.log("Patient Location:", patientUser.latitude, patientUser.longitude);

//         // Fetch all volunteers from the "volunteers" collection
//         const volunteers = await db.get().collection(collection.VOLUNTEER_COLLECTION).find({ 
//             volunteerId: { $exists: true } 
//         }).toArray();

//         if (volunteers.length === 0) {
//             return res.render('error', { message: "No volunteers found" });
//         }

//         console.log("All Volunteers Retrieved:", volunteers.length);

//         // Filter volunteers based on matching `patientNeeds`
//         const matchedVolunteers = volunteers.filter(volunteer => {
//             if (!Array.isArray(volunteer.patientNeeds)) {
//                 console.warn("Skipping volunteer with invalid patientNeeds:", volunteer);
//                 return false;
//             }
//             return volunteer.patientNeeds.some(need => patient.patientNeeds.includes(need));
//         });

//         if (matchedVolunteers.length === 0) {
//             return res.render('error', { message: "No volunteers match the required services" });
//         }

//         console.log("Filtered Volunteers:", matchedVolunteers.length);

//         // Fetch volunteer locations from USER_COLLECTION and calculate distances
//         const volunteersWithLocation = await Promise.all(matchedVolunteers.map(async (volunteer) => {
//             const volunteerUser = await db.get().collection(collection.USER_COLLECTION).findOne({
//                 _id: new ObjectId(volunteer.volunteerId),
//                 role: "volunteer",
//                 latitude: { $exists: true },
//                 longitude: { $exists: true }
//             });

//             if (!volunteerUser) {
//                 console.warn("Skipping volunteer with missing location:", volunteer.volunteerId);
//                 return null;
//             }

//             return {
//                 ...volunteer,
//                 latitude: volunteerUser.latitude,
//                 longitude: volunteerUser.longitude,
//                 distance: calculateDistance(patientUser.latitude, patientUser.longitude, volunteerUser.latitude, volunteerUser.longitude)
//             };
//         }));

//         // Remove null values and sort by distance
//         const finalSortedVolunteers = volunteersWithLocation.filter(v => v !== null).sort((a, b) => a.distance - b.distance);

//         console.log("Final Sorted Volunteers:", finalSortedVolunteers.map(v => ({ id: v.volunteerId, distance: v.distance })));

//         // Render the page with sorted volunteers
//         res.render('nearest-volunteers', { volunteers: finalSortedVolunteers, patient });

//     } catch (err) {
//         console.error("Error fetching volunteers:", err);
//         res.status(500).render('error', { message: "Internal Server Error" });
//     }
// });

// // Function to calculate distance between two coordinates (Haversine formula)
// function calculateDistance(lat1, lon1, lat2, lon2) {
//     const toRadians = (deg) => (deg * Math.PI) / 180;
//     const R = 6371; // Earth's radius in km

//     const dLat = toRadians(lat2 - lat1);
//     const dLon = toRadians(lon2 - lon1);
//     const a =
//         Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//         Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
//         Math.sin(dLon / 2) * Math.sin(dLon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c; // Distance in km
// }






router.post('/select-volunteer/:id', async (req, res) => {
    try {
        const { volunteerId, patientId } = req.body;

        if (!volunteerId || !patientId) {
            return res.status(400).json({ success: false, message: "Volunteer ID and Patient ID are required." });
        }

        // ✅ Ensure the NOTIFICATIONS_COLLECTION is correctly referenced
        if (!collection.NOTIFICATIONS_COLLECTION) {
            console.error("❌ ERROR: NOTIFICATIONS_COLLECTION is undefined!");
            return res.status(500).json({ success: false, message: "Server error: Notification collection is missing." });
        }

        // ✅ Store notification in database
        await db.get().collection(collection.NOTIFICATIONS_COLLECTION).insertOne({
            volunteerId,
            patientId,
            message: `You have been selected to assist a patient. Contact them for details.`,
            status: "unread",
            timestamp: new Date()
        });

        console.log(`📩 Notification sent to Volunteer ${volunteerId}`);

        // ✅ Redirect to patient profile
        res.redirect(`/patient-profile/${patientId}`);

    } catch (error) {
        console.error("❌ Error selecting volunteer:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});




module.exports=router;