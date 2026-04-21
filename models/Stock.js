const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
    idproduit: String,
    nom: String,
    nbpieces: Number,
    largeur: { type: Number, default: 0 },
    longeur: { type: Number, default: 0 },
    epaisseur: { type: Number, default: 0 },
    prixunit: Number,
    typex: String,
});

module.exports = mongoose.model('Stock', stockSchema);
