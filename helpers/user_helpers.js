
        
// // } ROLE BASED
var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb');
const Grid = require('gridfs-stream');
const fs = require('fs');
const path = require('path');


module.exports = {
    // doSignup: (userData, file) => {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             // Hash the password for security
    //             userData.password = await bcrypt.hash(userData.password, 10);
    //             userData.role = userData.role || 'volunteer'; // Default role if not provided

    //             // Handle file upload
    //             if (file) {
    //                 userData.idUpload = {
    //                     fileName: file.originalname,
    //                     fileBuffer: file.buffer,
    //                     fileType: file.mimetype,
    //                 };
    //             }

    //             // Insert user data into the database
    //             let result = await db.get().collection(collection.USER_COLLECTION).insertOne(userData);
    //             resolve(result);
    //         } catch (error) {
    //             reject(error);
    //         }
    //     });
    // },

    doSignup: (userData, file) => {
        return new Promise(async (resolve, reject) => {
            try {
                // Hash the password for security
                userData.password = await bcrypt.hash(userData.password, 10);
                userData.role = userData.role || 'volunteer'; // Default role if not provided
                userData.isActive = false; // Default to false, admin will activate
    
                // Handle file upload
                if (file) {
                    userData.idUpload = {
                        fileName: file.originalname,
                        fileBuffer: file.buffer,
                        fileType: file.mimetype,
                    };
                }
    
                // Insert user data into the database
                let result = await db.get().collection(collection.USER_COLLECTION).insertOne(userData);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    },
    

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            try {
                let response = {}
                if (!userData.email) return resolve({status: false, message: "Email is not defined"});

                let user = await db.get().collection(collection.USER_COLLECTION).findOne({email: userData.email});
                if (user) {
                    const status = await bcrypt.compare(userData.password, user.password);
                    if (status) {
                        response.user = user;
                        response.status = true;
                        resolve(response);
                    } else {
                        resolve({status: false});
                    }
                } else {
                    resolve({status: false});
                }
            } catch (error) {
                reject(error);
            }
        });
    },
   
        // addVolunteerHome: (volunteerData) => {
        //     return new Promise(async (resolve, reject) => {
        //         try {
        //             volunteerData.volunteerId = volunteerData.volunteerId || new ObjectId(); // Ensure unique ID
        //             let result = await db.get().collection(collection.VOLUNTEER_COLLECTION).insertOne(volunteerData);
        //             resolve(result);
        //         } catch (error) {
        //             reject(error);
        //         }
        //     });
        // },
        addVolunteerHome: (volunteerData) => {
            return new Promise(async (resolve, reject) => {
                try {
                    if (!volunteerData.volunteerId) {
                        return reject("Volunteer ID is missing");
                    }
        
                    let result = await db.get().collection(collection.VOLUNTEER_COLLECTION).insertOne(volunteerData);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        },
        
    

    addPatientHome: (patientData) => {
        return new Promise(async (resolve, reject) => {
            try {
                patientData.patientId = patientData.patientId || new ObjectId(); // Ensure unique ID
                let result = await db.get().collection(collection.PATIENT_COLLECTION).insertOne(patientData);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    },
    getVolunteerDetails: async (volunteerId) => {
        try {
            const volunteer = await User.findById(volunteerId);
            return volunteer;
        } catch (error) {
            console.error('Error fetching volunteer details:', error);
            throw error;
        }
    },

    addMatching:async(matchData)=>{
        try{
            const match=await db.get().collection(collection.MATCH_COLLECTION).insertOne(matchData)
            return match
        }
        catch(e){
            console.log(e.message);
            
        }
    }
    //matching


   



 };

//**********************************************************mongooseee
// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');

// // Import models
// const User = require('../models/user');
// const Volunteer = require('../models/volunteer');
// const Patient = require('../models/patient');
// const Match = require('../models/match');

// module.exports = {
//     // User Signup
//     doSignup: async (userData, file) => {
//         try {
//             // Hash password before saving
//             userData.password = await bcrypt.hash(userData.password, 10);
//             userData.role = userData.role || 'volunteer'; // Default role

//             // Handle file upload
//             if (file) {
//                 userData.idUpload = {
//                     fileName: file.originalname,
//                     fileBuffer: file.buffer,
//                     fileType: file.mimetype,
//                 };
//             }

//             // Create a new user using Mongoose
//             const newUser = new User(userData);
//             const result = await newUser.save();
//             return result;
//         } catch (error) {
//             throw error;
//         }
//     },

//     // User Login
//     doLogin: async (userData) => {
//         try {
//             if (!userData.email) return { status: false, message: "Email is required" };

//             const user = await User.findOne({ email: userData.email });
//             if (user) {
//                 const status = await bcrypt.compare(userData.password, user.password);
//                 if (status) {
//                     return { user, status: true };
//                 } else {
//                     return { status: false, message: "Invalid password" };
//                 }
//             } else {
//                 return { status: false, message: "User not found" };
//             }
//         } catch (error) {
//             throw error;
//         }
//     },

//     // Add Volunteer
//     addVolunteerHome: async (volunteerData) => {
//         try {
//             const newVolunteer = new Volunteer(volunteerData);
//             const result = await newVolunteer.save();
//             return result;
//         } catch (error) {
//             throw error;
//         }
//     },

//     // Add Patient
//     addPatientHome: async (patientData) => {
//         try {
//             const newPatient = new Patient(patientData);
//             const result = await newPatient.save();
//             return result;
//         } catch (error) {
//             throw error;
//         }
//     },

//     // Get Volunteer Details
//     getVolunteerDetails: async (volunteerId) => {
//         try {
//             const volunteer = await Volunteer.findById(volunteerId);
//             return volunteer;
//         } catch (error) {
//             throw error;
//         }
//     },

//     // Add Matching
//     addMatching: async (matchData) => {
//         try {
//             const newMatch = new Match(matchData);
//             const match = await newMatch.save();
//             return match;
//         } catch (error) {
//             throw error;
//         }
//     }
// };

