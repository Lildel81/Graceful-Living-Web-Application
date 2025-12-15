// controllers/footerController.js
const Footer = require('../models/footer');

// ensure a single footer doc exists
async function getOrCreateFooter() {

    let doc = await Footer.findOne();
    if (!doc) {
        doc = await Footer.create({
        phone: '',
        facebookUrl: '',
        facebookLabel: 'Facebook',
        instagramUrl: '',
        instagramLabel: 'Instagram',
        youtubeUrl: '',
        youtubeLabel: 'YouTube',
        });
    }
    return doc;
}


const getFooterManagement = async (req, res) => {
    try {
        const settings = await getOrCreateFooter();
        res.render('footer-settings', {
        csrfToken: req.csrfToken(),
        settings,
        saved: String(req.query.saved) === '1', 
        layout: false,
        error: req.query.error || null,
        });
    } catch (err) {
        console.error('Error loading footer settings:', err);
        res.status(500).send('Error loading footer settings');
    }
};

// POST save updates
const updateFooterSettings = async (req, res) => {
    try {
        const s = await getOrCreateFooter();
        s.phone = (req.body.phone || '').trim();
        s.facebookUrl = (req.body.facebookUrl || '').trim();
        s.facebookLabel = (req.body.facebookLabel || 'Facebook').trim();
        s.instagramUrl = (req.body.instagramUrl || '').trim();
        s.instagramLabel = (req.body.instagramLabel || 'Instagram').trim();
        s.youtubeUrl = (req.body.youtubeUrl || '').trim();
        s.youtubeLabel = (req.body.youtubeLabel || 'YouTube').trim();
        await s.save();
        res.redirect('/adminportal/footer-settings?saved=1');
    } catch (err) {
        console.error('Error updating footer settings:', err);
        res.status(500).send('Error updating footer settings');
    }
};

module.exports = {
  getFooterManagement,
  updateFooterSettings,
};
