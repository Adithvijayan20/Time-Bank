//************************************ mongoclint methode

const { MongoClient } = require('mongodb');
const fs = require('fs');

const state = {
    db: null
};

module.exports.connect = function(done) {
    const url = 'mongodb://localhost:27017';
    const dbname = 'timebankorg';

    MongoClient.connect(url)
        .then(client => {
            state.db = client.db(dbname);
            console.log('Connected to the database');
            done();
        })
        .catch(err => {
            console.error('Error connecting to the database:', err);
            done(err);
        });
};

module.exports.get = function() {
    if (!state.db) {
        throw new Error('Database not connected!');
    }
    return state.db;
};
//**************************************************************** mongoclinet methode

//mongoos
// const mongoose = require('mongoose');

// const state = {
//     db: null
// };

// module.exports.connect = function(done) {
//     const url = 'mongodb://localhost:27017/timebankorg';

//     mongoose.connect(url, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     })
//     .then(() => {
//         state.db = mongoose.connection;
//         console.log('Connected to the database');
//         done();
//     })
//     .catch(err => {
//         console.error('Error connecting to the database:', err);
//         done(err);
//     });
// };

// module.exports.get = function() {
//     if (!state.db) {
//         throw new Error('Database not connected!');
//     }
//     return state.db;
// };
