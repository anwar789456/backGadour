const express = require('express');
const router = express.Router();
const Client = require('../models/Client');

router.get('/fetch-client', async (req, res) => {
    try {
        const clients = await Client.find();
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/add-client', async (req, res) => {
    try {
        const { name, cin, adresse, matricule } = req.body;
        const newClient = new Client({ name, cin, adresse, matricule });
        await newClient.save();
        res.status(201).json({ message: 'Client added', newClient });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/update-client/:id', async (req, res) => {
    try {
        const updated = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Client not found' });
        res.json({ message: 'Client updated', updatedClient: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/delete-client-id/:id', async (req, res) => {
    try {
        const deleted = await Client.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Client not found' });
        res.json({ message: 'Client deleted', deletedClient: deleted });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
