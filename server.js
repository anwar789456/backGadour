require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const stockRoutes = require('./routes/stock');
const bonsRoutes = require('./routes/bons');
const facturesRoutes = require('./routes/factures');
const devisRoutes = require('./routes/devis');
const clientsRoutes = require('./routes/clients');

const app = express();

app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

app.use('/api', stockRoutes);
app.use('/api', bonsRoutes);
app.use('/api', facturesRoutes);
app.use('/api', devisRoutes);
app.use('/api', clientsRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;

connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
