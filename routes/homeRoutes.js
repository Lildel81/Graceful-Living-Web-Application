// routes/homeRoutes.js
const express = require('express');
const router = express.Router();


// If you use slides from DB or another file, import them here
//const slides = []; // placeholder, update as needed

/*router.get('/', (req, res) => {
  const allReviews = [
    { name: "Vicki Carroll", quote: "This event was excellent. I loved everything about it!", image: "/images/review-face1.png" },
    { name: "Claire Larke", quote: "Very engaging, interesting and charismatic. The content really got us all thinking outside the box.", image: "/images/review-face2.png" },
    { name: "Alexea Takacs", quote: "The energy, wisdom and motivation the workshop gave me was what I liked most about the event.", image: "/images/review-face3.png" },
    { name: "Adanna Eke", quote: "I rate the event as excellent! I liked the partner activity the most. I would definitely recommend to a friend!", image: "/images/review-face1.png" },
    { name: "Shirley Brown", quote: "I really enjoyed the positiveness of the subject matter, the positiveness in the room and of the speaker.", image: "/images/review-face2.png" },
    { name: "Latoya Holmes-Green", quote: "I learned how to increase my energy vibration and redirect my thoughts to the outcomes I want. Shante is so nurturing and caring.", image: "/images/review-face3.png" },
    { name: "Sha D.", quote: "Shante has a nurturing energy which is of paramount importance when working toward health and wellness.", image: "/images/review-face1.png" },
    { name: "Amanda Chacon", quote: "Your examples always relate to something I’m dealing with. It’s refreshing and eye opening!", image: "/images/review-face2.png" },
    { name: "Philip Victor Rader", quote: "It was very interesting and enlightening. Thank you for helping me see more clearly and guiding me in my future.", image: "/images/review-face3.png" },
    { name: "Rhonda Miller", quote: "Enlightening, energizing, repairing my soul, cleansing—thank you, you are amazing!", image: "/images/review-face1.png" },
    { name: "Cindi Tolkmit", quote: "Thank you for being so welcoming and calming and bringing some clarity.", image: "/images/review-face2.png" },
    { name: "Irene Barron", quote: "I feel lighter and like spirit is guiding me and cleaning me in and out. I love myself more… starting to love myself and put myself first.", image: "/images/review-face3.png" },
    { name: "Janean McGowen", quote: "Very observational and sensible. Knew how to help me approach my lifestyle.", image: "/images/review-face1.png" },
    { name: "Jenna Collins", quote: "Amazing, your energy is so vibrant and loving, thank you!", image: "/images/review-face2.png" },
    { name: "Maria Casarez", quote: "Loved it all! Thank you for your listening ear and guidance. I love the gong. I love the tapping.", image: "/images/review-face3.png" },
    { name: "Moe Bedolla", quote: "Thank you so much for setting me at peace with myself.", image: "/images/review-face1.png" },
    { name: "DL Whitaker", quote: "I realize I need a f*cking break, thank you for helping me see that!", image: "/images/review-face2.png" },
    { name: "Diana Cor", quote: "She (Coach Tay) made me feel comfort, safe, and that my feelings are valuable.", image: "/images/review-face3.png" },
    { name: "Anessa Paz-Arias", quote: "This was absolutely amazing! 10/10!!", image: "/images/review-face1.png" },
    { name: "Carla Johnson", quote: "I really felt lighter after my session. So many thanks. I’m grateful.", image: "/images/review-face2.png" },
    { name: "Arynn Duncan", quote: "Your assistance on this journey was wonderful and uplifting. I wouldn’t change a thing!", image: "/images/review-face3.png" },
    { name: "Melina Breight", quote: "Outstanding communication & perspective on life issues. Wonderful experience! Thank you so much!", image: "/images/review-face1.png" },
    { name: "Mayra", quote: "One word: WONDERFUL! Thank you.", image: "/images/review-face2.png" },
    { name: "Valerie M.", quote: "This was extremely helpful. Realized I'm not breathing—these techniques help me center during stress.", image: "/images/review-face3.png" },
    { name: "Saundra W.", quote: "I feel stronger, have more energy, and love how I feel in my body.", image: "/images/review-face1.png" },
    { name: "Casie P.", quote: "I enjoy the breath work and chanting and mantras I can repeat to myself during times of stress.", image: "/images/review-face2.png" },
    { name: "Eric Wulf", quote: "Great information, well presented. Shining personality! Well informed.", image: "/images/review-face3.png" },
    { name: "Mark Keskeny", quote: "Great job, very interesting and effective!", image: "/images/review-face1.png" },
    { name: "Quincia Lynn Burlson", quote: "Great job, LOVED the exercises. Loved the gong…I appreciate you!", image: "/images/review-face2.png" },
    { name: "Stephanie Torres", quote: "I arrived with anxiety and I’m leaving with clarity and calmness <3", image: "/images/review-face3.png" },
    { name: "Hannah Ramirez", quote: "Such a powerful soundbath. Opened my eyes to be myself and to love me as I am.", image: "/images/review-face1.png" },
    { name: "Marisela Alcala", quote: "I came in tired. This helped me find my center again. Thank you!!", image: "/images/review-face2.png" },
    { name: "Lori Lynch", quote: "Wonderful! Relaxed! Ready for my day and Life!", image: "/images/review-face3.png" },
    { name: "Angie Doctolero", quote: "Don’t change Anything! Loved it and loved Your Energy!", image: "/images/review-face1.png" },
    { name: "Alma Espejo", quote: "I enjoyed being in a safe space and in tune with myself. <3", image: "/images/review-face2.png" },
    { name: "Michelle Cano", quote: "You were great. I felt the powerful healing.", image: "/images/review-face3.png" },
    { name: "Natalie Sanchez", quote: "Your energy is on point. There is enough of a balance for an intro class.", image: "/images/review-face1.png" },
    { name: "Kathy Wilson", quote: "Thank you for providing a safe and healing experience. You made a comfortable space for me to just be Me!", image: "/images/review-face2.png" },
  ];
  
  const getRandomReviews = (list, count) => {
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const selectedReviews = getRandomReviews(allReviews, 3);

  res.render('home', { slides, selectedReviews });
});*/

module.exports = router;
