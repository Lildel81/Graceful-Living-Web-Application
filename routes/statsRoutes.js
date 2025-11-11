const express = require("express");
const ChakraAssessment = require("../models/chakraAssessment");
const router = express.Router();
const csrfProtection = require("../middleware/csrf")

// in-memory cache
let statsCache = {
  data: null,
  timestamp: null,
  ttl: 5 * 60 * 1000 // 5 minutes
};

// helper to check cache validity
function isCacheValid() {
  if (!statsCache.data || !statsCache.timestamp) return false;
  return (Date.now() - statsCache.timestamp) < statsCache.ttl;
}

// route: admin dashboard
router.get("/", csrfProtection, async (req, res) => {
  try {
    let stats, assessments;

    if (isCacheValid()) {
      console.log("Using cached stats data");
      stats = statsCache.data.stats;
      assessments = statsCache.data.assessments;
    } else {
      console.log("Fetching fresh stats data");
      assessments = await ChakraAssessment.find({});
      if (!Array.isArray(assessments)) assessments = [];

      stats = calculateAggregateStats(assessments);
      statsCache.data = { stats, assessments };
      statsCache.timestamp = Date.now();
    }

    res.render("stats/admin-dashboard", { stats, assessments });
  } catch (err) {
    console.error("Error fetching statistics:", err);
    res.status(500).send("Error loading statistics");
  }
});

function getMonthFilter(monthParam) {
  if (!monthParam) return {};
  const [year, month] = monthParam.split('-').map(Number);
  if (!year || !month) return {};

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { createdAt: { $gte: start, $lte: end } };
}

// ex: /stats/api/chart-data?month=2025-10
router.get("/api/chart-data", async (req, res) => {
  try {
    const monthFilter = getMonthFilter(req.query.month);
    let assessments;

    if (isCacheValid() && !req.query.month) {
      console.log("Using cached chart data");
      //assessments = statsCache.data.assessments;
    } else {
      //console.log("Fetching fresh chart data");
      assessments = await ChakraAssessment.find(monthFilter);
      if (!Array.isArray(assessments)) assessments = [];

      const stats = calculateAggregateStats(assessments);
      if (!req.query.month) { // don’t cache filtered data
        statsCache.data = { stats, assessments };
        statsCache.timestamp = Date.now();
      }
    }

    const chartData = prepareChartData(assessments);
    res.json(chartData);
  } catch (err) {
    console.error("Error fetching chart data:", err);
    res.status(500).json({ error: "Error loading chart data" });
  }
});

router.get("/api/stats-summary", async (req, res) => {
  try {
    const monthFilter = getMonthFilter(req.query.month);
    let stats;

    if (isCacheValid() && !req.query.month) {
      //console.log("Using cached stats summary");
      stats = statsCache.data.stats;
    } else {
      //console.log("Fetching fresh stats summary");
      const assessments = await ChakraAssessment.find(monthFilter);
      if (!Array.isArray(assessments)) assessments = [];
      stats = calculateAggregateStats(assessments);

      stats.totalSubmissions = assessments.length;

      if (!req.query.month) {
        statsCache.data = { stats, assessments };
        statsCache.timestamp = Date.now();
      }
    }

    res.json(stats);
  } catch (err) {
    console.error("Error fetching stats summary:", err);
    res.status(500).json({ error: "Error loading stats summary" });
  }
});


// API: Clear cache manually
router.post("/api/clear-cache", (req, res) => {
  statsCache.data = null;
  statsCache.timestamp = null;
  //console.log("Stats cache cleared");
  res.json({ message: "Cache cleared successfully" });
});

// Helper: Aggregate stats
function calculateAggregateStats(assessments) {
  const stats = {
    chakraAverages: {},
    lifeQuadrantAverages: {},
    focusChakraDistribution: {},
    archetypeDistribution: {},
    ageBracketDistribution: {},
    topChallenges: {},
    experienceDistribution: {},
    familiarityDistribution: {},
    healthcareDistribution: {}
  };

  const chakraNames = [
    "rootChakra",
    "sacralChakra",
    "solarPlexusChakra",
    "heartChakra",
    "throatChakra",
    "thirdEyeChakra",
    "crownChakra"
  ];

  const lifeQuadrantNames = [
    "healthWellness",
    "loveRelationships",
    "careerJob",
    "timeMoney"
  ];

  // Initialize data structures
  chakraNames.forEach(ch => {
    stats.chakraAverages[ch] = { scores: [] };
  });
  lifeQuadrantNames.forEach(q => {
    stats.lifeQuadrantAverages[q] = { scores: [] };
  });

  // Iterate over all assessments
  assessments.forEach(assessment => {
    // --- Chakra Scores ---
    chakraNames.forEach(ch => {
      const chakraData = assessment.results?.get
        ? assessment.results.get(ch)
        : assessment.results?.[ch];

      if (chakraData && chakraData.total !== undefined) {
        stats.chakraAverages[ch].scores.push(chakraData.total);
      }
    });

    // --- Life Quadrant Scores ---
    lifeQuadrantNames.forEach(q => {
      let quadrantData = null;
      
      // Try multiple access methods
      if (assessment.scoredLifeQuadrants?.get) {
        quadrantData = assessment.scoredLifeQuadrants.get(q);
      } 
      else if (assessment.scoredLifeQuadrants?.[q]) {
        quadrantData = assessment.scoredLifeQuadrants[q];
      }
      else if (assessment.results?.get) {
        quadrantData = assessment.results.get(q);
      }
      else if (assessment.results?.[q]) {
        quadrantData = assessment.results[q];
      }

      if (quadrantData) {
        // If it has a total, use it
        if (quadrantData.total !== undefined) {
          stats.lifeQuadrantAverages[q].scores.push(quadrantData.total);
        }
        // If it's a Map of answers, sum the scores
        else if (typeof quadrantData.entries === 'function') {
          let total = 0;
          for (const [, entry] of quadrantData.entries()) {
            if (entry.score !== undefined) total += entry.score;
          }
          if (total > 0) {
            stats.lifeQuadrantAverages[q].scores.push(total);
          }
        }
        // If it's an object of answers, sum the scores
        else if (typeof quadrantData === 'object') {
          let total = 0;
          Object.values(quadrantData).forEach(entry => {
            if (entry && entry.score !== undefined) total += entry.score;
          });
          if (total > 0) {
            stats.lifeQuadrantAverages[q].scores.push(total);
          }
        }
      }
    });

    // --- Focus Chakra Distribution ---
    if (assessment.focusChakra) {
      stats.focusChakraDistribution[assessment.focusChakra] =
        (stats.focusChakraDistribution[assessment.focusChakra] || 0) + 1;
    }

    // --- Archetype Distribution ---
    const archetypeValue = assessment.archetypeResult || assessment.archetype || assessment.archetypeName;
    if (archetypeValue) {
      stats.archetypeDistribution[archetypeValue] =
        (stats.archetypeDistribution[archetypeValue] || 0) + 1;
    }

    // --- Age Bracket Distribution ---
    if (assessment.ageBracket) {
      stats.ageBracketDistribution[assessment.ageBracket] =
        (stats.ageBracketDistribution[assessment.ageBracket] || 0) + 1;
    }

    // --- Challenges ---
    const challenges = assessment.topChallenges || assessment.challenges;
    if (challenges && Array.isArray(challenges)) {
      challenges.forEach(ch => {
        stats.topChallenges[ch] = (stats.topChallenges[ch] || 0) + 1;
      });
    }

    // --- Experience with Holistic Health Practitioners ---
    if (assessment.experience) {
      const key = assessment.experience;
      stats.experienceDistribution[key] = (stats.experienceDistribution[key] || 0) + 1;
    }

    // --- Familiarity with Techniques ---
    if (Array.isArray(assessment.familiarWith)) {
      // If "none" is selected, count it exclusively
      if (assessment.familiarWith.includes('none')) {
        stats.familiarityDistribution['none'] =
          (stats.familiarityDistribution['none'] || 0) + 1;
      } else {
        for (const v of assessment.familiarWith) {
            stats.familiarityDistribution[v] = (stats.familiarityDistribution[v] || 0) + 1;
        }
      }
    }

    // --- Healthcare worker ---
    if (assessment.healthcareWorker) {
      const key = assessment.healthcareWorker.toLowerCase() === 'yes' ? 'yes' : 'no';
      stats.healthcareDistribution[key] = (stats.healthcareDistribution[key] || 0) + 1;
    }
  });

  // --- Compute Averages & Modes ---
  const computeAverageAndMode = scores => {
    if (!scores.length) return { average: 0, mode: 0 };
    const average = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);

    // Compute mode (most frequent value)
    const frequency = {};
    let mode = scores[0];
    let maxCount = 1;
    for (const s of scores) {
      frequency[s] = (frequency[s] || 0) + 1;
      if (frequency[s] > maxCount) {
        maxCount = frequency[s];
        mode = s;
      }
    }
    return { average, mode };
  };

  // Calculate for each Chakra
  Object.entries(stats.chakraAverages).forEach(([ch, data]) => {
    const { average, mode } = computeAverageAndMode(data.scores);
    stats.chakraAverages[ch] = { average, mode };
  });

  // Calculate for each Life Quadrant
  Object.entries(stats.lifeQuadrantAverages).forEach(([q, data]) => {
    const { average, mode } = computeAverageAndMode(data.scores);
    stats.lifeQuadrantAverages[q] = { average, mode };
  });

  return stats;
}

// Helper: Prepare chart data
function prepareChartData(assessments) {
  if (!Array.isArray(assessments)) {
    console.error("prepareChartData: assessments is not an array", assessments);
    return null;
  }

  const stats = calculateAggregateStats(assessments);
  if (!stats) return null;

  // Mapping keys to readable labels
  const focusChakraLabelsMap = {
    rootChakra: "Root",
    sacralChakra: "Sacral",
    solarPlexusChakra: "Solar Plexus",
    heartChakra: "Heart",
    throatChakra: "Throat",
    thirdEyeChakra: "Third Eye",
    crownChakra: "Crown"
  };

  const archetypeLabelsMap = {
    caretaker: "Caretaker",
    saboteur: "Saboteur",
    creatorVisionary: "Creator/Visionary",
    workerBee: "Worker Bee",
    innerChild: "Inner Child", 
    ruler: "Ruler",
    lover: "Lover",
    rebel: "Rebel",
    martyr: "Martyr"
  };

  // Color palettes
  const challengeColors = [
    "rgba(255,99,132,0.7)", "rgba(54,162,235,0.7)", "rgba(255,206,86,0.7)",
    "rgba(75,192,192,0.7)", "rgba(153,102,255,0.7)", "rgba(255,159,64,0.7)"
  ];

  const archetypeColors = [
    "rgba(255,99,132,0.7)", "rgba(54,162,235,0.7)", "rgba(255,206,86,0.7)",
    "rgba(75,192,192,0.7)", "rgba(153,102,255,0.7)"
  ];

  const ageBracketColors = [
    "rgba(255,99,132,0.7)", "rgba(54,162,235,0.7)", "rgba(255,206,86,0.7)",
    "rgba(75,192,192,0.7)", "rgba(153,102,255,0.7)"
  ];

  const expColors = [
    "rgba(46,213,115,0.7)","rgba(255,107,129,0.7)",
    "rgba(72,126,176,0.7)","rgba(255,177,66,0.7)",
    "rgba(153,102,255,0.7)"
  ];

  const famColors = [
    "rgba(54,162,235,0.7)","rgba(255,206,86,0.7)","rgba(75,192,192,0.7)",
    "rgba(255,159,64,0.7)","rgba(255,99,132,0.7)","rgba(153,102,255,0.7)"
  ];
  const famBorders = famColors.map(c => c.replace('0.7','1'));


  // Safe helper to get average or return 0
  const getAverage = (obj, key) => {
    return obj && obj[key] && obj[key].average !== undefined 
      ? parseFloat(obj[key].average) 
      : 0;
  };

  return {
    chakraData: {
      labels: ["Root","Sacral","Solar Plexus","Heart","Throat","Third Eye","Crown"],
      datasets: [{
        label: "Average Chakra Scores",
        data: [
          getAverage(stats.chakraAverages, 'rootChakra'),
          getAverage(stats.chakraAverages, 'sacralChakra'),
          getAverage(stats.chakraAverages, 'solarPlexusChakra'),
          getAverage(stats.chakraAverages, 'heartChakra'),
          getAverage(stats.chakraAverages, 'throatChakra'),
          getAverage(stats.chakraAverages, 'thirdEyeChakra'),
          getAverage(stats.chakraAverages, 'crownChakra')
        ],
        backgroundColor:[
          "rgba(195,20,50,0.7)","rgba(243,115,53,0.7)","rgba(253,203,110,0.7)",
          "rgba(0,184,148,0.7)","rgba(9,132,227,0.7)","rgba(108,92,231,0.7)","rgba(253,121,168,0.7)"
        ],
        borderColor:[
          "rgb(195,20,50)","rgb(243,115,53)","rgb(253,203,110)","rgb(0,184,148)","rgb(9,132,227)","rgb(108,92,231)","rgb(253,121,168)"
        ],
        borderWidth:2
      }]
    },
    lifeQuadrantData: {
      labels: ["Health & Wellness","Love & Relationships","Career/Job","Time & Money"],
      datasets:[{
        label:"Average Life Quadrant Scores",
        data:[
          getAverage(stats.lifeQuadrantAverages, 'healthWellness'),
          getAverage(stats.lifeQuadrantAverages, 'loveRelationships'),
          getAverage(stats.lifeQuadrantAverages, 'careerJob'),
          getAverage(stats.lifeQuadrantAverages, 'timeMoney')
        ],
        backgroundColor:["rgba(46,213,115,0.7)","rgba(255,107,129,0.7)","rgba(72,126,176,0.7)","rgba(255,177,66,0.7)"],
        borderColor:["rgb(46,213,115)","rgb(255,107,129)","rgb(72,126,176)","rgb(255,177,66)"],
        borderWidth:2
      }]
    },
    ageBracketData:{
      labels:Object.keys(stats.ageBracketDistribution),
      datasets:[{
        label:"Age Distribution",
        data:Object.values(stats.ageBracketDistribution),
        backgroundColor:Object.keys(stats.ageBracketDistribution).map((_, i) => ageBracketColors[i % ageBracketColors.length]),
      }]
    },
    challengesData:{
      labels:Object.keys(stats.topChallenges),
      datasets:[{
        label:"Top Challenges",
        data:Object.values(stats.topChallenges),
        backgroundColor:Object.keys(stats.topChallenges).map((_, i) => challengeColors[i % challengeColors.length]),
        borderColor:Object.keys(stats.topChallenges).map((_, i) => challengeColors[i % challengeColors.length].replace("0.7","1")),
        borderWidth:2
      }]
    },
    focusChakraData: {
      labels: Object.keys(stats.focusChakraDistribution).map(key => focusChakraLabelsMap[key] || key),
      datasets:[{
        label:"Focus Chakra Distribution",
        data: Object.values(stats.focusChakraDistribution),
        backgroundColor: Object.keys(stats.focusChakraDistribution).map(key => {
          // Map each chakra key to its specific color
          const colorMap = {
            rootChakra: "rgba(195,20,50,0.7)",           // Red
            sacralChakra: "rgba(243,115,53,0.7)",        // Orange
            solarPlexusChakra: "rgba(253,203,110,0.7)",  // Yellow
            heartChakra: "rgba(0,184,148,0.7)",          // Green
            throatChakra: "rgba(9,132,227,0.7)",         // Blue
            thirdEyeChakra: "rgba(108,92,231,0.7)",      // Indigo
            crownChakra: "rgba(253,121,168,0.7)"         // Violet
          };
          return colorMap[key] || "rgba(128,128,128,0.7)"; // Gray fallback
        }),
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    archetypeData:{
      labels: Object.keys(stats.archetypeDistribution).map(key => archetypeLabelsMap[key] || key),
      datasets:[{
        label:"Archetype Distribution",
        data:Object.values(stats.archetypeDistribution),
        backgroundColor:Object.keys(stats.archetypeDistribution).map((_, i) => archetypeColors[i % archetypeColors.length]),
        borderColor:Object.keys(stats.archetypeDistribution).map((_, i) => archetypeColors[i % archetypeColors.length].replace("0.7","1")),
        borderWidth:2
      }]
    },
    experienceData: (() => {
      const order = [
        { key: 'current',  label: 'Yes, currently working with one' },
        { key: 'past',     label: 'Yes, in the past' },
        { key: 'no',       label: 'No, this is my first time' },
        { key: 'notSure',  label: 'Not sure' },
        { key: 'other',    label: 'Other' }
      ];
      const counts = stats.experienceDistribution || {};
      const labels = order.map(o => o.label);
      const data   = order.map(o => counts[o.key] || 0);

      const colors  = ['rgba(46,213,115,0.7)','rgba(72,126,176,0.7)','rgba(255,177,66,0.7)','rgba(153,102,255,0.7)','rgba(255,107,129,0.7)'];
      return {
        labels,
        datasets: [{
          label: 'Experience',
          data,
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        }]
      };
    })(),
    familiarityData: (() => {
      const order = [
        { key: 'kundalini',   label: 'Kundalini Yoga' },
        { key: 'soundBaths',  label: 'Sound Baths' },
        { key: 'lifeCoaching',label: 'Life Coaching' },
        { key: 'eft',         label: 'EFT (tapping)' },
        { key: 'none',        label: 'None of the above' }
      ];
      const counts = stats.familiarityDistribution || {};
      const labels = order.map(o => o.label);
      const data   = order.map(o => counts[o.key] || 0);

      const colors  = [
        'rgba(54,162,235,0.7)',
        'rgba(255,206,86,0.7)',
        'rgba(75,192,192,0.7)',
        'rgba(255,159,64,0.7)',
        'rgba(153,102,255,0.7)'
      ];
      const borders = colors.map(c => c.replace('0.7','1'));

      return {
        labels,
        datasets: [{
          label: 'Familiarity',
          data,
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
          borderColor:     labels.map((_, i) => borders[i % borders.length]),
          borderWidth: 2
        }]
      };
    })(),
    healthcareData: (() => {
      const counts = stats.healthcareDistribution || {};
      const labels = ['Yes', 'No'];
      const data   = [counts['yes'] || 0, counts['no'] || 0];

      const colors  = ['rgba(46,213,115,0.7)', 'rgba(255,107,129,0.7)'];

      return {
        labels,
        datasets: [{
          label: 'Healthcare Workers',
          data,
          backgroundColor: colors,
        }]
      };
    })(),
  };
}

module.exports = router;