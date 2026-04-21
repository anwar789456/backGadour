const mongoose = require('mongoose');

const devisClientSchema = new mongoose.Schema({
    nomclient: { type: String },
    devis: [
        {
            devis_num: { type: Number },
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
        },
    ],
});

module.exports = mongoose.model('devisclient', devisClientSchema);
