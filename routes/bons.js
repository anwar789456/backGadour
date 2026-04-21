const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Bon = require('../models/Bon');
const { BonCompteur } = require('../models/Compteur');

router.get('/getbon', async (req, res) => {
    try {
        const bonData = await Bon.find();
        res.json(bonData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/getbonbyclientmfcin', async (req, res) => {
    const { client, mfcin } = req.query;
    try {
        const bonData = await Bon.find({ client, mfcin });
        res.json(bonData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/getbon-clientname', async (req, res) => {
    const { client } = req.query;
    try {
        const document = await Bon.findOne({ client });
        res.json(document);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/get-bon-by-year', async (req, res) => {
    const { year } = req.query;
    if (!year) return res.status(400).json({ error: 'Year is required' });
    try {
        const document = await BonCompteur.findOne({ year });
        if (!document) return res.status(404).json({ error: 'Document not found' });
        res.json(document);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/bons/by-year', async (req, res) => {
    try {
        const { year } = req.query;
        if (!year) return res.status(400).json({ message: 'year is required' });
        const bonsData = await BonCompteur.find({ year });
        res.json(bonsData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/get-bonscompteur', async (req, res) => {
    try {
        const allBonsCompteurs = await BonCompteur.find();
        res.json(allBonsCompteurs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/addbon', async (req, res) => {
    try {
        const { client, date, mfcin, adresse, destination, chauffeur, matriculevoiture, articles, compteur } = req.body;
        const newBon = new Bon({ client, date, mfcin, adresse, destination, chauffeur, matriculevoiture, articles, compteur });
        const savedBon = await newBon.save();
        res.status(201).json(savedBon);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/add-bons/retour', async (req, res) => {
    try {
        const newBon = new Bon({ ...req.body, retour: 'retour', status: 'green' });
        const savedBon = await newBon.save();
        res.status(201).json(savedBon);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/increment-bons', async (req, res) => {
    const { year } = req.body;
    try {
        const updatedBon = await BonCompteur.findOneAndUpdate(
            { year },
            { $inc: { bonscompteur: 1 } },
            { new: true, upsert: true }
        );
        res.status(200).json({ message: 'Bon compteur updated', data: updatedBon });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/updatebon/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid Bon ID' });
        const updatedBon = await Bon.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedBon) return res.status(404).json({ error: 'Bon not found' });
        res.json(updatedBon);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/bonscompteur/:id', async (req, res) => {
    try {
        const updatedBonsc = await BonCompteur.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedBonsc);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/bons/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBon = await Bon.findByIdAndDelete(id);
        if (!deletedBon) return res.status(404).json({ error: 'Bon not found' });
        res.json({ message: 'Bon deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
