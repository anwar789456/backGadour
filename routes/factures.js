const express = require('express');
const router = express.Router();
const Facture = require('../models/Facture');
const { FactureCompteur } = require('../models/Compteur');

router.get('/check-client/:nomclient', async (req, res) => {
    try {
        const client = await Facture.findOne({ nomclient: req.params.nomclient });
        if (client) return res.status(200).json({ exists: true });
        return res.status(404).json({ exists: false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/get-clients-factures', async (req, res) => {
    try {
        const clients = await Facture.find();
        res.status(200).json(clients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/get-facturecompteur', async (req, res) => {
    try {
        const all = await FactureCompteur.find();
        res.json(all);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/get-facture-by-year', async (req, res) => {
    const { year } = req.query;
    try {
        const document = await FactureCompteur.findOne({ year });
        res.json(document);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/add-client-facture', async (req, res) => {
    try {
        const { nomclient, facture } = req.body;
        const newClient = new Facture({ nomclient, factures: [facture] });
        await newClient.save();
        res.status(201).json({ message: 'Client and first facture added', data: newClient });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/add-facture/:nomclient', async (req, res) => {
    try {
        const { nomclient } = req.params;
        const { facture } = req.body;
        const client = await Facture.findOne({ nomclient });
        if (!client) return res.status(404).json({ message: 'Client not found' });
        client.factures.push(facture);
        await client.save();
        res.status(200).json({ message: 'Facture added successfully', data: client });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/add-advance/:nomclient/:factureId', async (req, res) => {
    try {
        const { nomclient, factureId } = req.params;
        const { amount, date } = req.body;
        const client = await Facture.findOne({ nomclient });
        if (!client) return res.status(404).json({ message: 'Client not found' });
        const facture = client.factures.find(f => f.facture_num.toString() === factureId);
        if (!facture) return res.status(404).json({ message: 'Facture not found' });
        facture.advances.push({ amount, date: new Date(date) });
        await client.save();
        res.status(200).json({ message: 'Advance payment added', data: client });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/increment-facture', async (req, res) => {
    const { year } = req.body;
    try {
        const updated = await FactureCompteur.findOneAndUpdate(
            { year },
            { $inc: { facturecompteur: 1 } },
            { new: true, upsert: true }
        );
        res.status(200).json({ message: 'Facture compteur updated', data: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/facturesnum/:nomclient/:factureId', async (req, res) => {
    try {
        const { nomclient, factureId } = req.params;
        const updatedFacture = req.body;
        const clientDoc = await Facture.findOne({ nomclient });
        if (!clientDoc) return res.status(404).json({ message: 'Client not found' });
        const factureIndex = clientDoc.factures.findIndex(f => f._id.toString() === factureId);
        if (factureIndex === -1) return res.status(404).json({ message: 'Facture not found' });
        clientDoc.factures[factureIndex].facture_num = updatedFacture.facture_num;
        clientDoc.factures[factureIndex].articles = updatedFacture.articles;
        await clientDoc.save();
        res.json(clientDoc.factures[factureIndex]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/update-facture/:clientName/:factureId', async (req, res) => {
    try {
        const { clientName, factureId } = req.params;
        const updatedFacture = req.body;
        const client = await Facture.findOne({ nomclient: clientName });
        if (!client) return res.status(404).json({ message: 'Client not found' });
        const factureIndex = client.factures.findIndex(f => f._id.toString() === factureId);
        if (factureIndex === -1) return res.status(404).json({ message: 'Facture not found' });
        const existingFacture = client.factures[factureIndex].toObject();
        client.factures[factureIndex] = { ...existingFacture, ...updatedFacture, _id: existingFacture._id };
        await client.save();
        return res.status(200).json({ success: true, updatedFacture: client.factures[factureIndex] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/update-facture-status/:nomclient/:factureId', async (req, res) => {
    try {
        const { nomclient, factureId } = req.params;
        const { status } = req.body;
        const result = await Facture.findOneAndUpdate(
            { nomclient, 'factures._id': factureId },
            { $set: { 'factures.$.status': status } },
            { new: true }
        );
        res.status(200).json({ message: 'Facture status updated', data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/update-advance/:nomclient/:factureId/:advanceId', async (req, res) => {
    try {
        const { nomclient, factureId, advanceId } = req.params;
        const { amount, date } = req.body;
        const client = await Facture.findOne({ nomclient });
        if (!client) return res.status(404).json({ message: 'Client not found' });
        const facture = client.factures.find(f => f.facture_num.toString() === factureId);
        if (!facture) return res.status(404).json({ message: 'Facture not found' });
        const advance = facture.advances.find(a => a._id.toString() === advanceId);
        if (!advance) return res.status(404).json({ message: 'Advance not found' });
        if (amount !== undefined) advance.amount = amount;
        if (date !== undefined) advance.date = new Date(date);
        await client.save();
        res.status(200).json({ message: 'Advance updated', data: client });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/facturecompteur/:id', async (req, res) => {
    try {
        const updated = await FactureCompteur.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/delete-client/:nomclient', async (req, res) => {
    try {
        const client = await Facture.findOneAndDelete({ nomclient: req.params.nomclient });
        if (!client) return res.status(404).json({ message: 'Client not found' });
        res.status(200).json({ message: 'Client and all factures deleted', data: client });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/delete-facture/:nomclient/:factureId', async (req, res) => {
    try {
        const { nomclient, factureId } = req.params;
        const client = await Facture.findOne({ nomclient });
        if (!client) return res.status(404).json({ message: 'Client not found' });
        client.factures = client.factures.filter(f => f._id.toString() !== factureId);
        await client.save();
        res.status(200).json({ message: 'Facture deleted', data: client });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/delete-advance/:nomclient/:factureId/:advanceId', async (req, res) => {
    try {
        const { nomclient, factureId, advanceId } = req.params;
        const client = await Facture.findOne({ nomclient });
        if (!client) return res.status(404).json({ message: 'Client not found' });
        const facture = client.factures.find(f => f.facture_num.toString() === factureId);
        if (!facture) return res.status(404).json({ message: 'Facture not found' });
        facture.advances = facture.advances.filter(a => a._id.toString() !== advanceId);
        await client.save();
        res.status(200).json({ message: 'Advance deleted', data: client });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
