const express = require('express');
const router = express.Router();
const Fournisseur = require('../models/Fournisseur');
const FactureFournisseur = require('../models/FactureFournisseur');
const BonLivraisonFournisseur = require('../models/BonLivraisonFournisseur');

const montantRegle = (facture) =>
    facture.reglements
        .filter(r => r.statut === 'Paye')
        .reduce((sum, r) => sum + (r.montant || 0), 0);

const statutFacture = (facture) => {
    const regle = montantRegle(facture);
    if (regle <= 0) return 'Non Reglee';
    if (regle + 0.001 >= facture.montant) return 'Reglee';
    return 'Partiellement Reglee';
};

const enrichFacture = (facture) => {
    const obj = facture.toObject();
    obj.montantRegle = montantRegle(facture);
    obj.resteAPayer = Math.max(0, (facture.montant || 0) - obj.montantRegle);
    obj.statutFacture = statutFacture(facture);
    return obj;
};

const soldeFournisseur = (factures) => {
    const mouvementTotal = factures.reduce((sum, f) => sum + (f.montant || 0), 0);
    const totalRegle = factures.reduce((sum, f) => sum + montantRegle(f), 0);
    return { mouvementTotal, totalRegle, solde: mouvementTotal - totalRegle };
};

/* ------------------------------ Fournisseurs ------------------------------ */

router.get('/fetch-fournisseurs', async (req, res) => {
    try {
        const fournisseurs = await Fournisseur.find();
        const factures = await FactureFournisseur.find();
        const result = fournisseurs.map(f => {
            const obj = f.toObject();
            const own = factures.filter(fa => String(fa.fournisseur) === String(f._id));
            return { ...obj, ...soldeFournisseur(own) };
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/add-fournisseur', async (req, res) => {
    try {
        const newFournisseur = new Fournisseur(req.body);
        await newFournisseur.save();
        res.status(201).json({ message: 'Fournisseur added', newFournisseur });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/update-fournisseur/:id', async (req, res) => {
    try {
        const updated = await Fournisseur.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Fournisseur not found' });
        res.json({ message: 'Fournisseur updated', updatedFournisseur: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/delete-fournisseur/:id', async (req, res) => {
    try {
        const deleted = await Fournisseur.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Fournisseur not found' });
        await FactureFournisseur.deleteMany({ fournisseur: req.params.id });
        await BonLivraisonFournisseur.deleteMany({ fournisseur: req.params.id });
        res.json({ message: 'Fournisseur deleted', deletedFournisseur: deleted });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fiche fournisseur : infos + factures enrichies + bons + solde
router.get('/fournisseur/:id', async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findById(req.params.id);
        if (!fournisseur) return res.status(404).json({ message: 'Fournisseur not found' });
        const factures = await FactureFournisseur.find({ fournisseur: req.params.id }).sort({ date: -1 });
        const bons = await BonLivraisonFournisseur.find({ fournisseur: req.params.id }).sort({ date: -1 });
        res.json({
            fournisseur,
            factures: factures.map(enrichFacture),
            bons,
            ...soldeFournisseur(factures),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ------------------------- Factures fournisseur --------------------------- */

router.post('/fournisseur/:id/factures', async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findById(req.params.id);
        if (!fournisseur) return res.status(404).json({ message: 'Fournisseur not found' });
        const facture = new FactureFournisseur({
            ...req.body,
            fournisseur: fournisseur._id,
            // Fournisseur exonéré => certificat de retenue à la source non effectué
            crsNonEffectue: fournisseur.exonere,
        });
        await facture.save();
        res.status(201).json({ message: 'Facture added', facture: enrichFacture(facture) });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/facture-fournisseur/:id', async (req, res) => {
    try {
        const updated = await FactureFournisseur.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Facture not found' });
        res.json({ message: 'Facture updated', facture: enrichFacture(updated) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/facture-fournisseur/:id', async (req, res) => {
    try {
        const deleted = await FactureFournisseur.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Facture not found' });
        res.json({ message: 'Facture deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ------------------------------ Règlements -------------------------------- */

router.post('/facture-fournisseur/:id/reglements', async (req, res) => {
    try {
        const facture = await FactureFournisseur.findById(req.params.id);
        if (!facture) return res.status(404).json({ message: 'Facture not found' });

        const reglement = { ...req.body };
        // Une traite reste en cours jusqu'à son échéance ; les autres modes sont payés directement
        if (!reglement.statut) reglement.statut = reglement.mode === 'Traite' ? 'En cours' : 'Paye';

        // Règlement (ou bon à payer) qui régularise une traite impayée
        if (reglement.reglementImpayeRef) {
            const impaye = facture.reglements.id(reglement.reglementImpayeRef);
            if (!impaye || impaye.statut !== 'Impaye') {
                return res.status(400).json({ error: 'Règlement impayé introuvable' });
            }
            impaye.statut = 'Regularise';
        }

        facture.reglements.push(reglement);
        await facture.save();
        res.status(201).json({ message: 'Reglement added', facture: enrichFacture(facture) });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/facture-fournisseur/:factureId/reglements/:regId', async (req, res) => {
    try {
        const facture = await FactureFournisseur.findById(req.params.factureId);
        if (!facture) return res.status(404).json({ message: 'Facture not found' });
        const reglement = facture.reglements.id(req.params.regId);
        if (!reglement) return res.status(404).json({ message: 'Reglement not found' });
        Object.assign(reglement, req.body);
        await facture.save();
        res.json({ message: 'Reglement updated', facture: enrichFacture(facture) });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/facture-fournisseur/:factureId/reglements/:regId', async (req, res) => {
    try {
        const facture = await FactureFournisseur.findById(req.params.factureId);
        if (!facture) return res.status(404).json({ message: 'Facture not found' });
        const reglement = facture.reglements.id(req.params.regId);
        if (!reglement) return res.status(404).json({ message: 'Reglement not found' });
        reglement.deleteOne();
        await facture.save();
        res.json({ message: 'Reglement deleted', facture: enrichFacture(facture) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* --------------------------- Bons de livraison ---------------------------- */

router.post('/fournisseur/:id/bons', async (req, res) => {
    try {
        const bon = new BonLivraisonFournisseur({ ...req.body, fournisseur: req.params.id });
        await bon.save();
        res.status(201).json({ message: 'Bon added', bon });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/bon-fournisseur/:id', async (req, res) => {
    try {
        const updated = await BonLivraisonFournisseur.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Bon not found' });
        res.json({ message: 'Bon updated', bon: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/bon-fournisseur/:id', async (req, res) => {
    try {
        const deleted = await BonLivraisonFournisseur.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Bon not found' });
        res.json({ message: 'Bon deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ------------------------------- Échéancier ------------------------------- */

// Toutes les échéances à venir : traites en cours + factures non soldées avec échéance.
// alerte = échéance dans <= 3 jours (ou dépassée) => suivi de la liquidité en banque.
router.get('/fournisseurs-echeances', async (req, res) => {
    try {
        const factures = await FactureFournisseur.find().populate('fournisseur', 'name');
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const echeances = [];

        for (const facture of factures) {
            const nomFournisseur = facture.fournisseur?.name || '—';

            for (const r of facture.reglements) {
                if (r.mode === 'Traite' && r.statut === 'En cours' && r.echeance) {
                    echeances.push({
                        type: 'Traite',
                        fournisseur: nomFournisseur,
                        fournisseurId: facture.fournisseur?._id,
                        factureId: facture._id,
                        factureNumero: facture.numero,
                        reglementId: r._id,
                        montant: r.montant,
                        banque: r.banque,
                        reference: r.reference,
                        echeance: r.echeance,
                    });
                }
                if (r.mode === 'Traite' && r.statut === 'Impaye') {
                    echeances.push({
                        type: 'Traite impayee',
                        fournisseur: nomFournisseur,
                        fournisseurId: facture.fournisseur?._id,
                        factureId: facture._id,
                        factureNumero: facture.numero,
                        reglementId: r._id,
                        montant: r.montant,
                        banque: r.banque,
                        reference: r.reference,
                        echeance: r.echeance,
                    });
                }
            }

            if (facture.echeance && statutFacture(facture) !== 'Reglee') {
                echeances.push({
                    type: 'Facture',
                    fournisseur: nomFournisseur,
                    fournisseurId: facture.fournisseur?._id,
                    factureId: facture._id,
                    factureNumero: facture.numero,
                    montant: Math.max(0, facture.montant - montantRegle(facture)),
                    echeance: facture.echeance,
                });
            }
        }

        const withDelais = echeances.map(e => {
            const echeanceDate = new Date(e.echeance);
            echeanceDate.setHours(0, 0, 0, 0);
            const joursRestants = Math.round((echeanceDate - now) / (1000 * 60 * 60 * 24));
            return {
                ...e,
                joursRestants,
                enRetard: e.type === 'Traite impayee' || joursRestants < 0,
                alerte: e.type === 'Traite impayee' || joursRestants <= 3,
            };
        }).sort((a, b) => new Date(a.echeance) - new Date(b.echeance));

        res.json(withDelais);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
