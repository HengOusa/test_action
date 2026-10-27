const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is working!'
    })
});

app.post('/api/subscribe', (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
        return res.status(400).json({
            success: false,
            message: 'A valid email is required.'
        });
    }
    return res.status(201).json({
        success: true,
        message: 'Subscribed successfully',
        data: { email }
    });
});

module.exports = app;

if (require.main === module) {
    app.listen(3000, () => {
        console.log('Server is running at : http://localhost:3000');
    });
}