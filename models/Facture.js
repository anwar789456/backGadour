const mongoose = require('mongoose');

const factureSchema = new mongoose.Schema({
    nomclient: { type: String },
    factures: [
        {
            facture_num: { type: Number },
            status: { type: String, default: 'actif' },
            date: { type: Date },
            articles: [
                {
                    nomproduit: { type: String },
                    nombrepieces: { type: Number },
                    largeur: { type: Number },
                    longeur: { type: Number },
                    epaisseur: { type: Number },
                    prix: { type: Number },
                    typex: { type: String },
                },
            ],
            advances: [
                {
                    amount: { type: Number },
                    date: { type: Date },
                },
            ],
        },
    ],
});

module.exports = mongoose.model('factures', factureSchema);
