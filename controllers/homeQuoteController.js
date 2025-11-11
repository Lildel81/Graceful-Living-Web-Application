const HomeQuote = require('../models/homeQuote');

// ensure a single home quote doc exists
async function getOrCreateHomeQuote() {
    let doc = await HomeQuote.findOne();
    if (!doc) {
        doc = await HomeQuote.create({
            quoteText: '“Lorem ipsum dolor sit amet, consectetur adipiscing elit.”',
        });
    }
    return doc;
}

// GET - render the content management page
const getHomeQuoteManagement = async (req, res) => {
    try {
        const settings = await getOrCreateHomeQuote();
            res.render('homequote-settings', {
            csrfToken: req.csrfToken(),
            settings,
            saved: String(req.query.saved) === '1',
            layout: false,
            error: req.query.error || null,
        });
    } catch (err) {
        console.error('Error loading homepage quote settings:', err);
        res.status(500).send('Error loading homepage quote settings');
    }
};

// POST - save quote updates
const updateHomeQuoteSettings = async (req, res) => {
    try {
        const s = await getOrCreateHomeQuote();
        s.quoteText = (req.body.quoteText || '').trim();
        await s.save();
        res.redirect('/adminportal/homequote-settings?saved=1');
    } catch (err) {
        console.error('Error updating homepage quote:', err);
        res.status(500).send('Error updating homepage quote');
    }
};

module.exports = {
    getHomeQuoteManagement,
    updateHomeQuoteSettings,
};