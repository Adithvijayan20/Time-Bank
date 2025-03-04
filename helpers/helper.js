const db = require('../config/connection');
const collection = require('../config/collections');
const { ObjectId } = require('mongodb');

// This function runs once the database is connected
async function getPatientVolunteerMatches(id) {
  try {
    console.log(id);
    
    // Fetch all patients first
    const patients = await db.get().collection(collection.PATIENT_COLLECTION).find({patientId:id}).toArray();
    
    const matches = [];

    // Loop through patients and find corresponding volunteers
    for (const patient of patients) {
      // Fetch matching volunteers for each patient
      const volunteers = await db.get().collection(collection.VOLUNTEER_COLLECTION).find({
        volunteerServices: patient.patientNeeds,
        
      }).toArray();

      // If there are matching volunteers, add to the results
      if (volunteers.length > 0) {
        volunteers.forEach(volunteer => {
          matches.push({
            patientId: patient.patientId,
            volunteerId:volunteer.volunteerId,
            patientName: patient.patientName,
            volunteerName: volunteer.volunteerName,
            date: patient.date,
            time: patient.time,
            work: patient.patientNeeds, // Renaming patientNeeds to work,
            active:false
          });
        });
      }
    }

    console.log('This is matches', matches);
    return matches;
  } catch (err) {
    console.error("Error in getPatientVolunteerMatches: ", err);
    throw err;
  }
}

// Function to save matches into MATCH_COLLECTION
async function saveMatches(matches) {
  if (matches.length === 0) {
    console.log("No matches found to insert.");
    return;
  }

  try {
    // Create an array to hold only the unique matches
    const uniqueMatches = [];

    for (const match of matches) {
      // Check if this match already exists by matchId
      const existingMatch = await db.get().collection(collection.MATCH_COLLECTION).findOne({ matchId: match.matchId });

      if (!existingMatch) {
        // If the match doesn't exist, push it to the uniqueMatches array
        uniqueMatches.push(match);
      } else {
        console.log(`Match with matchId ${match.matchId} already exists. Skipping.`);
      }
    }

    if (uniqueMatches.length > 0) {
      // Insert only the unique matches
      const result = await db.get().collection(collection.MATCH_COLLECTION).insertMany(uniqueMatches);
      console.log(`${result.insertedCount} unique matches inserted into the database.`);
    } else {
      console.log('No new matches to insert.');
    }
  } catch (err) {
    console.error("Error inserting matches:", err);
  }
}

// Ensure connection is established before using it
db.connect(async function(err) {
  if (err) {
    console.error('Failed to connect to database');
    return;
  }

  try {
    // Fetch matching patient and volunteer pairs
    // const matches = await getPatientVolunteerMatches();
    
    // // Save matches into the new collection
    // await saveMatches(matches);
  } catch (err) {
    console.error('Error retrieving or saving matches:', err);
  }
});
module.exports={getPatientVolunteerMatches}