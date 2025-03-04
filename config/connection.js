// const { MongoClient } = require('mongodb');

// const state = {
//     db: null
// };

// module.exports.connect = function(done) {
//     const url = 'mongodb://localhost:27017';
//     const dbname = 'timebankorg';

//     MongoClient.connect(url)
//         .then(client => {
//             state.db = client.db(dbname);
//             done();
//         })
//         .catch(err => {
//             done(err);
//         });
// };

// module.exports.get = function() {
//     return state.db;
// };
//1







// const { MongoClient } = require('mongodb');
// const fs = require('fs');

// const state = {
//     db: null
// };

// module.exports.connect = function(done) {
//     const url = 'mongodb://localhost:27017';
//     const dbname = 'timebankorg';

//     MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
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
