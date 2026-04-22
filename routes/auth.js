const express = require('express');
const router  = express.Router();

router.post('/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (
        username === process.env.LOGIN_USERNAME &&
        password === process.env.LOGIN_PASSWORD
    ) {
        return res.json({ ok: true });
    }

    res.status(401).json({ ok: false, message: 'Identifiant ou mot de passe incorrect.' });
});

module.exports = router;
