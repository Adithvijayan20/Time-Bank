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
// const bcrypt = require('bcrypt')
const bcrypt = require('bcryptjs');

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

// router.get('/nearest-volunteers/:id', async (req, res) => {
//     try {
//       const patientId = req.params.id;
  
//       // Fetch the patient record from PATIENT_COLLECTION by patientId.
//       // This record should be updated with the latest service request.
//       const patient = await db.get()
//       .collection(collection.PATIENT_COLLECTION)
//       .findOne({ patientId }, { sort: { _id: -1 }  }); 
  
//       console.log('patient ',patient);
      
//       if (!patient) {
//         return res.status(404).render('error', { message: "Patient not found" });
//       }
  
//       // Use currentPatientNeeds if available (latest request), else fall back to patientNeeds.
//       const currentNeeds = (Array.isArray(patient.currentPatientNeeds) && patient.currentPatientNeeds.length > 0)
//         ? patient.currentPatientNeeds
//         : patient.patientNeeds;
      
//       console.log("Using current patient needs:", currentNeeds);
  
//       if (!Array.isArray(currentNeeds) || currentNeeds.length === 0) {
//         return res.render('error', { message: "Patient needs data is missing or incorrect" });
//       }
  
//       // Fetch detailed patient info (like fullName and location) from USER_COLLECTION.
//       // We assume that the patient _id in the USER_COLLECTION is the same as patientId.
//       const patientUser = await db.get()
//         .collection(collection.USER_COLLECTION)
//         .findOne({
//           _id: new ObjectId(patientId),
//           role: "patient",
//           latitude: { $exists: true, $ne: null },
//           longitude: { $exists: true, $ne: null }
//         });
      
//       if (!patientUser) {
//         return res.status(404).render('error', { message: "Patient location not found" });
//       }
  
//       // Attach fullName to the patient object.
//       patient.fullName = patientUser.fullName;
//       console.log("✅ Patient Name:", patient.fullName);
  
//       // Fetch all volunteers from the VOLUNTEER_COLLECTION.
//       const volunteers = await db.get()
//         .collection(collection.VOLUNTEER_COLLECTION)
//         .find()
//         .toArray();
      
//       console.log("Volunteers from DB:", volunteers);
  
//       if (volunteers.length === 0) {
//         return res.render('error', { message: "No volunteers found" });
//       }
  
//       // Filter volunteers based solely on the current patient needs
//       // (which are fetched from the patient collection).
//       const matchedVolunteers = volunteers.filter(volunteer => {
//         // Ensure volunteer.patientNeeds is an array.
//         const volunteerNeeds = Array.isArray(volunteer.patientNeeds)
//           ? volunteer.patientNeeds
//           : [volunteer.patientNeeds];
//         return volunteerNeeds.some(need => currentNeeds.includes(need));
//       });
  
//       if (matchedVolunteers.length === 0) {
//         return res.render('error', { message: "No volunteers match the required services" });
//       }
  
//       // Fetch additional user details for each matched volunteer.
//       const volunteersWithLocation = await Promise.all(matchedVolunteers.map(async (volunteer) => {
//         let volunteerId = volunteer.volunteerId;
//         try {
//           const volunteerUser = await db.get()
//             .collection(collection.USER_COLLECTION)
//             .findOne({
//               _id: new ObjectId(volunteerId),
//               role: "volunteer",
//               latitude: { $exists: true, $ne: null },
//               longitude: { $exists: true, $ne: null }
//             });
  
//           if (!volunteerUser) {
//             return null;
//           }
  
//           return {
//             ...volunteer,
//             latitude: volunteerUser.latitude,
//             longitude: volunteerUser.longitude,
//             address: volunteerUser.address,
//             phoneNumber: volunteerUser.phoneNumber,
//             profilePic: volunteerUser.profileImageUrl,
//             fullName: volunteerUser.fullName,
//             volunteerId: volunteerUser._id.toString(),
//             patientId: patientUser._id.toString(),
//             // calculateDistance should be defined elsewhere in your code
//             distance: calculateDistance(
//               patientUser.latitude,
//               patientUser.longitude,
//               volunteerUser.latitude,
//               volunteerUser.longitude
//             )
//           };
//         } catch (error) {
//           console.error(`Error fetching location for volunteerId: ${volunteerId}`, error);
//           return null;
//         }
//       }));
  
//       // Remove any null entries and sort by distance (closest first).
//       const finalSortedVolunteers = volunteersWithLocation
//         .filter(v => v !== null)
//         .sort((a, b) => a.distance - b.distance);
  
//       if (finalSortedVolunteers.length === 0) {
//         return res.render('error', { message: "No nearby volunteers found." });
//       }
  
//       // Render the 'nearest-volunteers' page with the list of volunteers and patient info.
//       res.render('nearest-volunteers', { 
//         volunteers: finalSortedVolunteers, 
//         patient 
//       });
//     } catch (err) {
//       console.error("Error fetching volunteers:", err);
//       res.status(500).render('error', { message: "Internal Server Error" });
//     }
//   });






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



//**********************************************new 
router.get('/nearest-volunteers/:id', async (req, res) => {
  try {
      const patientId = req.params.id;

      // Fetch the patient record from PATIENT_COLLECTION by patientId.
      // This record should be updated with the latest service request.
      const patient = await db.get()
          .collection(collection.PATIENT_COLLECTION)
          .findOne({ patientId }, { sort: { _id: -1 } });

      console.log('patient ', patient);
    
      if (!patient) {
          return res.status(404).render('error', { message: "Patient not found" });
      }

      // Use currentPatientNeeds if available (latest request), else fall back to patientNeeds.
      const currentNeeds = (Array.isArray(patient.currentPatientNeeds) && patient.currentPatientNeeds.length > 0)
          ? patient.currentPatientNeeds
          : patient.patientNeeds;
    
      console.log("Using current patient needs:", currentNeeds);

      if (!Array.isArray(currentNeeds) || currentNeeds.length === 0) {
          return res.render('error', { message: "Patient needs data is missing or incorrect" });
      }

      // Fetch detailed patient info (like fullName and location) from USER_COLLECTION.
      // We assume that the patient _id in the USER_COLLECTION is the same as patientId.
      const patientUser = await db.get()
          .collection(collection.USER_COLLECTION)
          .findOne({
              _id: new ObjectId(patientId),
              role: "patient",
              latitude: { $exists: true, $ne: null },
              longitude: { $exists: true, $ne: null }
          });
    
      if (!patientUser) {
          return res.status(404).render('error', { message: "Patient location not found" });
      }

      // Attach fullName to the patient object.
      patient.fullName = patientUser.fullName;
      console.log("✅ Patient Name:", patient.fullName);

      // Fetch all volunteers from the VOLUNTEER_COLLECTION.
      const volunteers = await db.get()
          .collection(collection.VOLUNTEER_COLLECTION)
          .find()
          .toArray();
    
      console.log("Volunteers from DB:", volunteers);

      if (volunteers.length === 0) {
          return res.render('error', { message: "No volunteers found" });
      }

      // Filter volunteers based solely on the current patient needs.
      const matchedVolunteers = volunteers.filter(volunteer => {
          // Ensure volunteer.patientNeeds is an array.
          const volunteerNeeds = Array.isArray(volunteer.patientNeeds)
              ? volunteer.patientNeeds
              : [volunteer.patientNeeds];
          return volunteerNeeds.some(need => currentNeeds.includes(need));
      });

      if (matchedVolunteers.length === 0) {
          return res.render('error', { message: "No volunteers match the required services" });
      }

      // Fetch additional user details, average rating, and calculate star HTML for each matched volunteer.
      const volunteersWithLocation = await Promise.all(matchedVolunteers.map(async (volunteer) => {
          let volunteerId = volunteer.volunteerId;
          try {
              const volunteerUser = await db.get()
                  .collection(collection.USER_COLLECTION)
                  .findOne({
                      _id: new ObjectId(volunteerId),
                      role: "volunteer",
                      latitude: { $exists: true, $ne: null },
                      longitude: { $exists: true, $ne: null }
                  });

              if (!volunteerUser) {
                  return null;
              }

              // Aggregate to calculate the average rating for this volunteer
              const ratingAggregation = await db.get()
                  .collection(collection.RATING_COLLECTION)
                  .aggregate([
                      { $match: { volunteerId: volunteerUser._id.toString() } },
                      { $group: { _id: "$volunteerId", avgRating: { $avg: "$rating" } } }
                  ])
                  .toArray();

              const avgRating = ratingAggregation.length > 0 ? ratingAggregation[0].avgRating : 0;

              // Compute star HTML based on the average rating (rounded)
              const rounded = Math.round(avgRating);
              let starHtml = '';
              for (let i = 0; i < rounded; i++) {
                  starHtml += '<i class="bx bxs-star" style="color: gold;"></i>';
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
                  avgRating, // Average rating as number
                  starHtml,  // Star icons as HTML string
                  distance: calculateDistance(
                      patientUser.latitude,
                      patientUser.longitude,
                      volunteerUser.latitude,
                      volunteerUser.longitude
                  )
              };
          } catch (error) {
              console.error(`Error fetching location or rating for volunteerId: ${volunteerId}`, error);
              return null;
          }
      }));

      // Remove any null entries and sort by distance (closest first).
      const finalSortedVolunteers = volunteersWithLocation
          .filter(v => v !== null)
          .sort((a, b) => a.distance - b.distance);

      if (finalSortedVolunteers.length === 0) {
          return res.render('error', { message: "No nearby volunteers found." });
      }

      // Render the 'nearest-volunteers' page with the list of volunteers and patient info.
      res.render('nearest-volunteers', { 
          volunteers: finalSortedVolunteers, 
          patient 
      });
  } catch (err) {
      console.error("Error fetching volunteers:", err);
      res.status(500).render('error', { message: "Internal Server Error" });
  }
});

// 📌 Function to calculate distance (in km)
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

//**********************************************
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