const Client = require('../models/client'); // ✅ Correct import

const getAllClients = async (req, res, next) => {
    try {
        const list = await Client.find(); // ✅ Make sure Client is properly imported
        res.render('clientlist', { client: list });
    } catch (error) {
        console.error("Error fetching clients:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = { getAllClients };
