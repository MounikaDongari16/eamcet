
try {
    console.log("Starting server debug...");
    require('dotenv').config();
    console.log("Dotenv loaded.");
    const express = require('express');
    const cors = require('cors');
    const app = express();
    app.use(cors());
    app.use(express.json());
    console.log("Express initialized.");

    console.log("Loading routes...");
    const apiRoutes = require('./routes/api');
    console.log("Routes loaded.");

    app.use('/api', apiRoutes);
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
} catch (err) {
    console.log("FATAL ERROR DURING STARTUP:");
    err.stack.split('\n').forEach(line => console.log("LOGLINE: " + line));
    process.exit(1);
}
