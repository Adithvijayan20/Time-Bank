// //************************************ mongoclint methode

// const { MongoClient } = require('mongodb');
// const fs = require('fs');

// const state = {
//     db: null
// };

// module.exports.connect = function(done) {
//     const url = 'mongodb://localhost:27017';
//     const dbname = 'timebankorg';

//     MongoClient.connect(url)
//         .then(client => {
//             state.db = client.db(dbname);
//             console.log('Connected to the database');
//             done();
//         })
//         .catch(err => {
//             console.error('Error connecting to the database:', err);
//             done(err);
//         });
// };

// module.exports.get = function() {
//     if (!state.db) {
//         throw new Error('Database not connected!');
//     }
//     return state.db;
// };
// // //**************************************************************** mongoclinet methode
const { MongoClient } = require('mongodb');

const state = {
    db: null
};

const uri = 'mongodb+srv://timebank:timebank@cluster0.u9vvvsx.mongodb.net/timebankorg?retryWrites=true&w=majority';

const dbname = 'timebankorg';

module.exports.connect = function(done) {
    MongoClient.connect(uri)
        .then(client => {
            state.db = client.db(dbname);
            console.log('Connected to MongoDB Atlas');
            done();
        })
        .catch(err => {
            console.error('Error connecting to MongoDB Atlas:', err);
            done(err);
        });
};

module.exports.get = function() {
    if (!state.db) {
        throw new Error('Database not connected!');
    }
    return state.db;
};
