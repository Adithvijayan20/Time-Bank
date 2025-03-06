const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    name: String,
    age: Number,
    medicalCondition: String,
    contact: String,
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
