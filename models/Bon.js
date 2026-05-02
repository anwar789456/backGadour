const mongoose = require('mongoose');

const bonSchema = new mongoose.Schema({
    client: String,
    date: String,
    mfcin: String,
    adresse: String,
    destination: String,
    chauffeur: String,
    matriculevoiture: String,
    articles: [
        {
            nomproduit: String,
            nombrepieces: Number,
            largeur: Number,
            longeur: Number,
            epaisseur: Number,
            prix: Number,
            typex: String,
        },
    ],
    compteur: Number,
    retour: String,
    status: { type: String, default: 'green' },
    facture_num: { type: Number, default: null },
});

module.exports = mongoose.model('bons', bonSchema);
