const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');

router.get('/stock', async (req, res) => {
    try {
        const stockData = await Stock.find();
        res.json(stockData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/stock/by-id', async (req, res) => {
    try {
        const { idproduit } = req.query;
        if (!idproduit) return res.status(400).json({ message: 'idproduit is required' });
        const stockData = await Stock.find({ idproduit });
        res.json(stockData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/stock/by-name', async (req, res) => {
    try {
        const { idproduit } = req.query;
        if (!idproduit) return res.status(400).json({ message: 'idproduit is required' });
        const stockData = await Stock.find({ idproduit });
        res.json(stockData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/getstock', async (req, res) => {
    try {
        const { idproduit, nom } = req.query;
        if (!idproduit && !nom) return res.status(400).json({ message: 'ID or name is required' });
        const query = {};
        if (idproduit) query.idproduit = idproduit;
        if (nom) query.nom = nom;
        const product = await Stock.findOne(query);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/fetch-products', async (req, res) => {
    try {
        const products = await Stock.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/addstock', async (req, res) => {
    const { idproduit, nomproduit, prix, nbpieces, typex, largeur, longeur, epaisseur } = req.body;
    try {
        const newStockItem = new Stock({
            idproduit,
            nom: nomproduit,
            prixunit: prix,
            largeur,
            longeur,
            epaisseur,
            nbpieces,
            typex,
        });
        await newStockItem.save();
        res.status(201).json(newStockItem);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/stock/:id', async (req, res) => {
    try {
        const stockItem = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!stockItem) return res.status(404).json({ message: 'Stock item not found' });
        res.json(stockItem);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/stock/delete', async (req, res) => {
    try {
        const { _id } = req.query;
        if (!_id) return res.status(400).json({ message: '_id is required' });
        const deletedStock = await Stock.findOneAndDelete({ _id });
        if (!deletedStock) return res.status(404).json({ message: 'Stock item not found' });
        res.json({ message: 'Stock item deleted successfully', deletedStock });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
