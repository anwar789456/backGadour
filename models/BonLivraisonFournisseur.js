const mongoose = require('mongoose');

const bonLivraisonFournisseurSchema = new mongoose.Schema(
    {
        fournisseur: { type: mongoose.Schema.Types.ObjectId, ref: 'Fournisseur', required: true },
        numero: { type: String, required: true },
        date: { type: Date, default: Date.now },
        montant: { type: Number, default: 0 },
        statut: { type: String, enum: ['Facture', 'Non Facture'], default: 'Non Facture' },
        numeroFacture: { type: String },
        note: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('BonLivraisonFournisseur', bonLivraisonFournisseurSchema);
