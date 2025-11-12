const IntroVideo = require('../models/introVideo');

/**
 * GET: Render the content management page with the current video
 */
exports.getContentManagement = async (req, res) => {
    try {
        const introVideo = await IntroVideo.findOne().lean();

        res.render('content-management', {
        csrfToken: req.csrfToken(),
        introVideo: introVideo || {}, // pass to <%= introVideo.videoUrl %>
        });
    } catch (error) {
        console.error('Error loading content management page:', error);
        res.status(500).send('Server error while loading page.');
    }
};

/**
 * POST: Save or update the intro video URL
 */
exports.updateIntroVideo = async (req, res) => {
    try {
        const { videoUrl } = req.body;

        // Basic validation
        if (!videoUrl || !videoUrl.trim()) {
        return res.status(400).send('Video URL is required');
        }

        // Update existing video or create a new one
        await IntroVideo.findOneAndUpdate(
        {},
        { videoUrl: videoUrl.trim() },
        { upsert: true, new: true }
        );

        console.log('Intro video updated:', videoUrl);
        res.redirect('/adminportal/content-management?updated=video');
    } catch (error) {
        console.error('Error updating intro video:', error);
        res.status(500).send('Server error while updating intro video.');
    }
};
