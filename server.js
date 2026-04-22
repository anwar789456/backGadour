require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes    = require('./routes/auth');
const stockRoutes   = require('./routes/stock');
const bonsRoutes    = require('./routes/bons');
const facturesRoutes = require('./routes/factures');
const devisRoutes   = require('./routes/devis');
const clientsRoutes = require('./routes/clients');

const app = express();

const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.DEV_FRONTEND_URL,
].filter(Boolean);

app.use(express.json());
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
}));

app.use('/api', authRoutes);
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
