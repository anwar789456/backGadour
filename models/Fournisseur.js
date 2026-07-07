const mongoose = require('mongoose');

const fournisseurSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        siegeSocial: { type: String },
        visAVis: { type: String },
        numTel: { type: String },
        matriculeFiscale: { type: String },
        rib: { type: String },
        exonere: { type: Boolean, default: false },
        exoneration: {
            reference: { type: String },
            dateDebut: { type: Date },
            dateFin: { type: Date },
            note: { type: String },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Fournisseur', fournisseurSchema);
