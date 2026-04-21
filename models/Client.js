const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
    {
        name: { type: String },
        adresse: { type: String },
        cin: { type: String },
        matricule: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
