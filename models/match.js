const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    matchDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
