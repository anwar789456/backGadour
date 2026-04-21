const mongoose = require('mongoose');

const devisCompteurSchema = new mongoose.Schema({
    deviscompteur: Number,
    year: String,
});

const bonCompteurSchema = new mongoose.Schema({
    year: String,
    bonscompteur: Number,
});

const factureCompteurSchema = new mongoose.Schema({
    year: String,
    facturecompteur: Number,
});

const DevisCompteur = mongoose.model('Luxmarconf', devisCompteurSchema);
const BonCompteur = mongoose.model('Boncompteur', bonCompteurSchema);
const FactureCompteur = mongoose.model('factcompteur', factureCompteurSchema);

module.exports = { DevisCompteur, BonCompteur, FactureCompteur };
