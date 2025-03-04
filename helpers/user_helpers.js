
        
// } ROLE BASED
var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb');
const Grid = require('gridfs-stream');
const fs = require('fs');
const path = require('path');

module.exports = {
    doSignup: (userData, file) => {
        return new Promise(async (resolve, reject) => {
            try {
                // Hash the password for security
                userData.password = await bcrypt.hash(userData.password, 10);
                userData.role = userData.role || 'volunteer'; // Default role if not provided

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

    // doSignup: (userData) => {
    //     return new Promise(async (resolve, reject) => {
    //         userData.password = await bcrypt.hash(userData.password, 10)
    //         userData.role = userData.role || 'volunteer'; // Default role if not provided
    //         db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
    //             resolve(data)
    //         })
    //     })
    // },

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
    //srevice
        // Add Volunteer Home Details
        // addVolunteerHome: (volunteerData) => {
        //     return new Promise(async (resolve, reject) => {
        //         try {
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
                    volunteerData.volunteerId = volunteerData.volunteerId || new ObjectId(); // Ensure unique ID
                    let result = await db.get().collection(collection.VOLUNTEER_COLLECTION).insertOne(volunteerData);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        },
    
        // Add Patient Home Details
    //     addPatientHome: (patientData) => {
    //         return new Promise(async (resolve, reject) => {
    //             try {
    //                 let result = await db.get().collection(collection.PATIENT_COLLECTION).insertOne(patientData);
    //                 resolve(result);
    //             } catch (error) {
    //                 reject(error);
    //             }
    //         });
    //     }
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

