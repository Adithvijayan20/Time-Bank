const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
    name: String,
    age: Number,
    phone: String,
    address: String,
}, { timestamps: true });

module.exports = mongoose.model('Volunteer', volunteerSchema);
