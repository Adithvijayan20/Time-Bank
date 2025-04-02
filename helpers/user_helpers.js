
        
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
        //             if (!volunteerData.volunteerId) {
        //                 return reject("Volunteer ID is missing");
        //             }
        
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

            const dbInstance = db.get().collection(collection.VOLUNTEER_COLLECTION);

            // Check if the volunteer already has a service entry
            let existingEntry = await dbInstance.findOne({ volunteerId: volunteerData.volunteerId });

            if (existingEntry) {
                // Update the existing service entry
                let updatedResult = await dbInstance.updateOne(
                    { volunteerId: volunteerData.volunteerId },
                    { $set: { patientNeeds: volunteerData.patientNeeds, ...volunteerData } }
                );
                resolve(updatedResult);
            } else {
                // Insert a new service entry
                let result = await dbInstance.insertOne(volunteerData);
                resolve(result);
            }
        } catch (error) {
            reject(error);
        }
    });
},

        
    

    // addPatientHome: (patientData) => {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             patientData.patientId = patientData.patientId || new ObjectId(); // Ensure unique ID
    //             let result = await db.get().collection(collection.PATIENT_COLLECTION).insertOne(patientData);
    //             resolve(result);
    //         } catch (error) {
    //             reject(error);
    //         }
    //     });
    // },
    addPatientHome: (patientData) => {
        return new Promise(async (resolve, reject) => {
            try {
                // Ensure we have a patientId (either from session or a new one if missing)
                patientData.patientId = patientData.patientId || new ObjectId();
    
                // Define the fields to update.
                // You can adjust which fields should be overwritten or merged.
                const updateFields = {
                    // Overwrite/refresh these fields every time
                    patientNeeds: patientData.patientNeeds,
                    time: patientData.time,
                    date: patientData.date,
                    // Include any other fields you want to update as needed
                };
    
                // Perform the upsert: update if exists, insert if not.
                let result = await db.get().collection(collection.PATIENT_COLLECTION)
                    .updateOne(
                        { patientId: patientData.patientId }, // Filter by patientId
                        { $set: updateFields },               // Set new values
                        { upsert: true }                      // Create if document doesn't exist
                    );
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
    },
// gg function**************************************************************************************************************


 doInstitution: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            userData.role = userData.role || 'institution'; 
            userData.isActive = true;
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data)
            })
        })
    },

addInstitutionRequest: (patientData) => {
    return new Promise(async (resolve, reject) => {
        try {
            patientData.patientId = patientData.patientId || new ObjectId();
            patientData.requestedTo = patientData.requestedTo || 'institution';
            patientData.status = patientData.status || 'pending';
            patientData.createdAt = new Date();
            patientData.updatedAt = new Date();
            patientData.patientNeeds = patientData.patientNeeds || 'none';
            let result = await db.get()
                .collection(collection.PATIENT_COLLECTION)
                .insertOne(patientData);
            
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
},

addMatchRequest: (matchData) => {
    return new Promise(async (resolve, reject) => {
        try {
            let result = await db.get()
                .collection(collection.MATCH_COLLECTION)
                .insertOne(matchData);
            
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
},

// Add these functions to your user_helpers.js
 getInstitutionNotifications: async (institutionId) => {
    if (!ObjectId.isValid(institutionId)) {
      throw new Error('Invalid institution ID');
    }
  
    const notifications = await db.get()
      .collection(collection.NOTIFICATIONS_COLLECTION)
      .find({
        userId: new ObjectId(institutionId),
        requestedTo: 'institution',
        status: { $ne: 'accepted' }
      })
      .sort({ createdAt: -1 })
      .toArray();
  
    return notifications;
  },
  
getEachInstiNotifications: (notificationId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!ObjectId.isValid(notificationId)) {
                return reject(new Error('Invalid institution ID'));
            }

            const notifications = await db.get()
                .collection(collection.NOTIFICATIONS_COLLECTION)
                .findOne({
                    _id: new ObjectId(notificationId),
                    requestedTo: 'institution'
                });
            resolve(notifications);
        } catch (error) {
            reject(error);
        }
    });
},

getUnreadNotificationCount: (institutionId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!ObjectId.isValid(institutionId)) {
                return reject(new Error('Invalid institution ID'));
            }

            const count = await db.get()
                .collection(collection.NOTIFICATIONS_COLLECTION)
                .countDocuments({
                    userId: new ObjectId(institutionId),
                    status: 'unread',
                    requestedTo: 'institution'
                });

            resolve(count);
        } catch (error) {
            reject(error);
        }
    });
},

markNotificationAsRead: (notificationId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!ObjectId.isValid(notificationId)) {
                return reject(new Error('Invalid notification ID'));
            }

            const result = await db.get()
                .collection(collection.NOTIFICATIONS_COLLECTION)
                .updateOne(
                    { _id: new ObjectId(notificationId) },
                    { $set: { status: 'read' } }
                );

            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}, 

getPatientLocation: (patientId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!ObjectId.isValid(patientId)) {
                return reject(new Error('Invalid volunteer ID'));
            }

            const volunteer = await db.get()
                .collection(collection.USER_COLLECTION)
                .findOne({ _id: new ObjectId(patientId) });
            resolve(volunteer);
        } catch (error) {
            reject(error);
        }
    });
},

getVolunteerById: (volunteerId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!ObjectId.isValid(volunteerId)) {
                return reject(new Error('Invalid volunteer ID'));
            }

            const volunteer = await db.get()
                .collection(collection.ASSIGNEDVOLUNTEER_COLLECTION)
                .findOne({ _id: new ObjectId(volunteerId) });

            resolve(volunteer);
        } catch (error) {
            reject(error);
        }
    });
},

// Save volunteer assignment
saveVolunteerAssignment: (assignmentData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await db.get()
                .collection(collection.ACCEPTEDVOLUNTEER_COLLECTION)
                .insertOne(assignmentData);

            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
},

// Get all assignments for an institution
getInstitutionAssignments: (institutionId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!ObjectId.isValid(institutionId)) {
                return reject(new Error('Invalid institution ID'));
            }

            const assignments = await db.get()
                .collection(collection.ACCEPTEDVOLUNTEER_COLLECTION)
                .find({
                    institutionId: new ObjectId(institutionId)
                })
                .sort({ assignedDate: -1 })
                .toArray();

            resolve(assignments);
        } catch (error) {
            reject(error);
        }
    });
},

getVolunteerProfile: (volunteerId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const profile = await db.get().collection(collection.USER_COLLECTION)
                .findOne({ _id: new ObjectId(volunteerId) });
            if (!profile) {
                throw new Error('Profile not found');
            }
            resolve(profile);
        } catch (error) {
            reject(error);
        }
    });
},

updateVolunteerProfile: (volunteerId, profileData) => {
    return new Promise(async (resolve, reject) => {
        try {
            await db.get().collection(collection.USER_COLLECTION)
                .updateOne(
                    { _id: new ObjectId(volunteerId) },
                    { $set: profileData }
                );
            resolve();
        } catch (error) {
            reject(error);
        }
    });
},

getInstitutionProfile: (institutionId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const profile = await db.get().collection(collection.USER_COLLECTION)
                .findOne({ _id: new ObjectId(institutionId) });
            if (!profile) {
                throw new Error('Profile not found');
            }
            resolve(profile);
        } catch (error) {
            reject(error);
        }
    });
},

updateInstitutionProfile: (institutionId, profileData, file) => {
    return new Promise(async (resolve, reject) => {
        try {
            const updatedData = {};
            if (file) {
                updatedData.profileImageUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            }
            await db.get().collection(collection.USER_COLLECTION)
                .updateOne(
                    { _id: new ObjectId(institutionId) },
                    { $set: { ...profileData, ...updatedData } }
                );
            resolve();
        } catch (error) {
            reject(error);
        }
    });
},

addInstitutionVolunteers: (volunteerData, institutionId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const requiredFields = ['fullName', 'age', 'phone', 'email', 'aadhaar', 'address', 'skill'];
            for (const field of requiredFields) {
                if (!volunteerData[field]) {
                    throw new Error(`${field} is required`);
                }
            }

            if (volunteerData.age < 18) {
                throw new Error('Volunteer must be at least 18 years old');
            }

            const existingVolunteer = await db.get().collection(collection.ASSIGNEDVOLUNTEER_COLLECTION)
                .findOne({
                    $or: [
                        { email: volunteerData.email },
                        { phone: volunteerData.phone },
                        { aadhaar: volunteerData.aadhaar }
                    ]
                });

            if (existingVolunteer) {
                throw new Error('Volunteer with this email, phone, or Aadhaar already exists');
            }
            volunteerData.institutionId = institutionId;
            const result = await db.get().collection(collection.ASSIGNEDVOLUNTEER_COLLECTION)
                .insertOne(volunteerData);
            console.log("result", result);
            resolve(result);
        } catch (error) {
            console.log("error", error);
            reject(error);
        }
    });
},

getViewVolunteersList: (institutionId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const ViewVolunteersList = await db.get().collection(collection.ASSIGNEDVOLUNTEER_COLLECTION)
                .find({ institutionId: institutionId, status: 'active' })
                .sort({ _id: -1 })
                .toArray();
            resolve(ViewVolunteersList);
        } catch (error) {
            reject(error);  
        }
    });
},

deleteVolunteer: (volunteerId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await db.get().collection(collection.ASSIGNEDVOLUNTEER_COLLECTION)
                .deleteOne({ _id: new ObjectId(volunteerId) });
            if (result.deletedCount === 0) {
                reject(new Error('Volunteer not found'));
            }
            resolve();
        } catch (error) {
            reject(error.message);
        }
    });
},

getViewEachVolunteers: (volunteerId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await db.get().collection(collection.ASSIGNEDVOLUNTEER_COLLECTION)
                .findOne({ _id: new ObjectId(volunteerId) });
            if (!result) {
                reject(new Error('Volunteer not found'));
            }
            resolve(result);  // Return the volunteer data
        } catch (error) {
            reject(error.message);
        }
    });
},

getUpdateEachVolunteer: (volunteerId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await db.get().collection(collection.ASSIGNEDVOLUNTEER_COLLECTION)
                .findOne({ _id: new ObjectId(volunteerId) });
            if (!result) {
                reject(new Error('Volunteer not found'));
            }
            resolve(result);  // Return the volunteer data
        } catch (error) {
            reject(error.message);
        }
    });
},

postUpdateEachVolunteer: (volunteerId, profileData) => {
    return new Promise(async (resolve, reject) => {
        try {
            await db.get().collection(collection.ASSIGNEDVOLUNTEER_COLLECTION)
                .updateOne(
                    { _id: new ObjectId(volunteerId) },
                    { $set: profileData }
                );
            resolve();
        } catch (error) {
            reject(error);
        }
    });
},

getDashboardStats: async (userId) => {        
    try {  
      const institution = await db.get().collection(collection.USER_COLLECTION).find({ _id: userId });              
      // Get counts from database             
      const totalVolunteers = await db.get().collection(collection.ASSIGNEDVOLUNTEER_COLLECTION).countDocuments({                  
        institutionId: userId,             
      });              
      
      const activeVolunteers = await db.get().collection(collection.ASSIGNEDVOLUNTEER_COLLECTION).countDocuments({                  
        institutionId: userId,                 
        status: 'active'             
      });              
      
      const blockedVolunteers = await db.get().collection(collection.ASSIGNEDVOLUNTEER_COLLECTION).countDocuments({                  
        institutionId: userId,                 
        status: 'blocked'             
      });              
      
      // Get today's services 
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);             
      const dailyServices = await db.get().collection(collection.ACCEPTEDVOLUNTEER_COLLECTION).countDocuments({
        institutionId: new ObjectId(userId),  // Ensure ObjectId match
        assignedDate: { $gte: today, $lt: tomorrow },  // Filter by today's date
        status: 'assigned'  
      });  
      
      // Get volunteer service performance             
      const volunteers = await db.get().collection(collection.ASSIGNEDVOLUNTEER_COLLECTION).find({                  
        institutionID: userId              
      }).toArray();              
      
      const volunteerPerformance = [];              
      for (const volunteer of volunteers) {                 
        const services = await db.get().collection(collection.ASSIGNEDVOLUNTEER_COLLECTION).countDocuments({                     
          institutionID: volunteer._id.toString(),                     
          completedDate: { $gte: today }                 
        });                  
        
        volunteerPerformance.push({                     
          id: volunteer._id,                     
          name: volunteer.fullName || volunteer.name,                     
          services: services,                     
          percent: services > 0 ? Math.min(services * 20, 100) : 0 // 5 services = 100%                 
        });             
      }              
      
      return {                 
        institutionName: institution.fullName,                 
        totalVolunteers,                 
        activeVolunteers,                 
        blockedVolunteers,                 
        dailyServices,                 
        volunteers: volunteerPerformance             
      };         
    } catch (error) {             
      console.error('Error fetching dashboard stats:', error);             
      return {                 
        institutionName: "Institution",                 
        totalVolunteers: 0,                 
        activeVolunteers: 0,                 
        blockedVolunteers: 0,                 
        dailyServices: 0,                 
        volunteers: []             
      };         
    }     
},

getActiveServicesList: (institutionId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!ObjectId.isValid(institutionId)) {
                return reject(new Error('Invalid institution ID'));
            }

            const ActiveServicesList = await db.get()
                .collection(collection.ACCEPTEDVOLUNTEER_COLLECTION)
                .find({
                    institutionId: new ObjectId(institutionId),
                    status: 'assigned'
                })
                .sort({ assignedDate: -1 })
                .toArray();
            resolve(ActiveServicesList);
        } catch (error) {
            reject(error);
        }
    });
},

// First, let's update the getVolunteerName function to improve error handling
getVolunteerName: (volunteerId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!ObjectId.isValid(volunteerId)) {
                return resolve('Unknown Volunteer'); // More user-friendly than an error
            }
    
            const volunteerData = await db.get()
                .collection(collection.ASSIGNEDVOLUNTEER_COLLECTION)
                .findOne({
                    _id: new ObjectId(volunteerId),
                    status: 'active'
                });
                
            if (!volunteerData || !volunteerData.fullName) {
                return resolve('Unknown Volunteer');
            }
            
            resolve(volunteerData.fullName);
        } catch (error) {
            console.error('Error fetching volunteer name:', error);
            resolve('Unknown Volunteer'); // Fallback instead of rejection
        }
    });
},

getEachServiceDetails: (eachServiceDetailsId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!ObjectId.isValid(eachServiceDetailsId)) {
                return resolve('Unknown Service Details'); // More user-friendly than an error
            }
    
            const ServiceDetails = await db.get()
                .collection(collection.ACCEPTEDVOLUNTEER_COLLECTION)
                .findOne({
                    _id: new ObjectId(eachServiceDetailsId),
                    status: 'assigned'
                });
            resolve(ServiceDetails);
        } catch (error) {
            console.error('Error fetching Service Details:', error);
            resolve('Unknown Service Details');
        }
    });
}
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

