const mongoose = require('mongoose');

const MODES_PAIEMENT = ['Compensation', 'Espece', 'Traite', 'Retenue a la Source', 'Virement'];

// Un règlement en Espece / Virement / Compensation / Retenue a la Source est payé immédiatement.
// Une Traite reste "En cours" jusqu'à son échéance, puis passe à "Paye" ou "Impaye".
// Une traite impayée est régularisée par un nouveau règlement (ou bon à payer)
// qui la référence via reglementImpayeRef.
const reglementSchema = new mongoose.Schema(
    {
        montant: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        mode: { type: String, enum: MODES_PAIEMENT, required: true },
        statut: { type: String, enum: ['En cours', 'Paye', 'Impaye', 'Regularise'], default: 'Paye' },
        echeance: { type: Date },
        banque: { type: String },
        reference: { type: String },
        bonAPayer: { type: Boolean, default: false },
        reglementImpayeRef: { type: mongoose.Schema.Types.ObjectId },
        note: { type: String },
    },
    { timestamps: true }
);

const factureFournisseurSchema = new mongoose.Schema(
    {
        fournisseur: { type: mongoose.Schema.Types.ObjectId, ref: 'Fournisseur', required: true },
        numero: { type: String, required: true },
        date: { type: Date, default: Date.now },
        montant: { type: Number, required: true },
        echeance: { type: Date },
        rsCertificat: {
            edite: { type: Boolean, default: false },
            numero: { type: String },
        },
        crsNonEffectue: { type: Boolean, default: false },
        note: { type: String },
        reglements: [reglementSchema],
    },
    { timestamps: true }
);

// Montant réglé = règlements honorés uniquement (les traites impayées ou
// régularisées ne comptent pas : c'est leur règlement de régularisation qui compte).
factureFournisseurSchema.methods.montantRegle = function () {
    return this.reglements
        .filter(r => r.statut === 'Paye')
        .reduce((sum, r) => sum + (r.montant || 0), 0);
};

factureFournisseurSchema.methods.statutFacture = function () {
    const regle = this.montantRegle();
    if (regle <= 0) return 'Non Reglee';
    if (regle + 0.001 >= this.montant) return 'Reglee';
    return 'Partiellement Reglee';
};

module.exports = mongoose.model('FactureFournisseur', factureFournisseurSchema);
module.exports.MODES_PAIEMENT = MODES_PAIEMENT;
