const express = require('express');
const router = express.Router();
const DevisClient = require('../models/DevisClient');
const { DevisCompteur } = require('../models/Compteur');

router.get('/get-deviscompteur', async (req, res) => {
    try {
        const all = await DevisCompteur.find();
        res.json(all);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/get-devis-by-year', async (req, res) => {
    const { year } = req.query;
    if (!year) return res.status(400).json({ error: 'Year is required' });
    try {
        const document = await DevisCompteur.findOne({ year });
        if (!document) return res.status(404).json({ error: 'Document not found' });
        res.json(document);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/devis/by-year', async (req, res) => {
    try {
        const { year } = req.query;
        if (!year) return res.status(400).json({ message: 'year is required' });
        const data = await DevisCompteur.find({ year });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/fetch-all-devisclients', async (req, res) => {
    try {
        const devisClients = await DevisClient.find();
        res.status(200).json(devisClients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/fetch/:nomclient', async (req, res) => {
    try {
        const client = await DevisClient.findOne({ nomclient: req.params.nomclient });
        if (!client) return res.status(404).json({ message: 'Client not found' });
        res.status(200).json(client);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/check-client-devis/:nomclient', async (req, res) => {
    try {
        const { nomclient } = req.params;
        if (!nomclient) return res.status(400).json({ message: 'nomclient is required' });
        const client = await DevisClient.findOne({ nomclient });
        if (client) return res.status(200).json({ exists: true });
        return res.status(404).json({ exists: false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/add-new-client', async (req, res) => {
    try {
        const { nomclient, orderdate, devis, devisCompteur } = req.body;
        const newClient = new DevisClient({
            nomclient,
            devis: [{ devis_num: devisCompteur, date: orderdate, articles: devis }],
        });
        await newClient.save();
        res.status(201).json({ message: 'Client with devis added', client: newClient });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/add-devis/:nomclient', async (req, res) => {
    try {
        const { nomclient } = req.params;
        const { date, articles, devisCompteur } = req.body;
        const client = await DevisClient.findOne({ nomclient });
        if (!client) return res.status(404).json({ message: 'Client not found' });
        client.devis.push({ date, devis_num: devisCompteur, articles });
        await client.save();
        res.status(200).json({ message: 'Devis added to client', client });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/increment-devis', async (req, res) => {
    const { year } = req.body;
    try {
        const updated = await DevisCompteur.findOneAndUpdate(
            { year },
            { $inc: { deviscompteur: 1 } },
            { new: true, upsert: true }
        );
        res.status(200).json({ message: 'Devis compteur updated', data: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/update-devis/:nomclient/:devisId', async (req, res) => {
    try {
        const { nomclient, devisId } = req.params;
        const client = await DevisClient.findOne({ nomclient });
        if (!client) return res.status(404).json({ message: 'Client not found' });
        const devis = client.devis.id(devisId);
        if (!devis) return res.status(404).json({ message: 'Devis not found' });
        Object.assign(devis, req.body);
        await client.save();
        res.status(200).json({ message: 'Devis updated', updatedDevis: devis });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/update-devisnum/:clientName/:devisId', async (req, res) => {
    try {
        const { clientName, devisId } = req.params;
        const { devis_num, date, articles } = req.body;
        const client = await DevisClient.findOne({ nomclient: clientName });
        if (!client) return res.status(404).json({ message: 'Client not found' });
        const devisIndex = client.devis.findIndex(d => d._id.toString() === devisId);
        if (devisIndex === -1) return res.status(404).json({ message: 'Devis not found' });
        const isDuplicate = client.devis.some((d, idx) => d.devis_num === devis_num && idx !== devisIndex);
        if (isDuplicate) return res.status(400).json({ message: `Devis numéro ${devis_num} existe déjà` });
        client.devis[devisIndex].devis_num = devis_num;
        if (date) client.devis[devisIndex].date = new Date(date);
        if (articles && Array.isArray(articles)) client.devis[devisIndex].articles = articles;
        await client.save();
        return res.status(200).json(client.devis[devisIndex]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/deviscompteur/:id', async (req, res) => {
    try {
        const updated = await DevisCompteur.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/delete-devis/:nomclient/:devisId', async (req, res) => {
    try {
        const { nomclient, devisId } = req.params;
        const client = await DevisClient.findOne({ nomclient });
        if (!client) return res.status(404).json({ message: 'Client not found' });
        client.devis = client.devis.filter(d => d._id.toString() !== devisId);
        await client.save();
        res.status(200).json({ message: 'Devis deleted', client });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/delete-client-devis/:nomclient', async (req, res) => {
    try {
        const client = await DevisClient.findOneAndDelete({ nomclient: req.params.nomclient });
        if (!client) return res.status(404).json({ message: 'Client not found' });
        res.status(200).json({ message: 'Client and all devis deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
