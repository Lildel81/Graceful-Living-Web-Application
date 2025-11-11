const Joi = require('joi');

const NEVER_SET   = ['Never','Sometimes','Often','Always'];
const QUALITY_SET = ['Poor','Fair','Good','Excellent'];

const norm = v => (typeof v === 'string' ? v.normalize('NFKC').trim() : v);
const jStr = () => Joi.string().custom(norm);

module.exports = {

  'POST /assessment/save': Joi.object({
    _csrf: Joi.string().required(),

    // Getting to know you
    fullName: jStr().min(1).max(100)
      .regex(/^[\p{L}\p{M}\p{Zs}.'-]+$/u)
      .messages({ 'string.pattern.base': 'Invalid name' })
      .required(),
    email: jStr().lowercase().email({ tlds: false }).max(254).required(),
    contactNumber: jStr().min(7).max(20).required(),

    ageBracket: Joi.string().valid('20-30','30-40','40-50','50+').required(),

    healthcareWorker: Joi.string().valid('yes','no').required(),
    healthcareYears: Joi.alternatives().conditional('healthcareWorker', {
      is: 'yes',
      then: Joi.number().integer().min(0).max(80).required(),
      otherwise: Joi.any().strip()
    }),

    jobTitle: jStr().min(1).max(100).required(),

    experience: Joi.string().valid('current','past','no','notSure','other').required(),
    experienceOtherText: Joi.alternatives().conditional('experience', {
      is: 'other',
      then: jStr().min(1).max(200).required(),
      otherwise: Joi.any().strip()
    }),

    familiarWith: Joi.array()
      .items(Joi.string().valid('kundalini','soundBaths','lifeCoaching','eft','none'))
      .single()
      .min(1)
      .required(),

    experienceDetails: jStr().max(2000).allow(''),

    goals: jStr().min(1).max(1000).required(),

    challenges: Joi.array()
      .items(Joi.string().valid('physical','emotional','mental','spiritual','other'))
      .single()
      .min(1)
      .required(),
    challengeOtherText: Joi.alternatives().conditional('challenges', {
      // require text only when "other" was selected
      is: Joi.array().items(Joi.string()).has(Joi.valid('other')),
      then: jStr().min(1).max(200).required(),
      otherwise: Joi.any().strip()
    }),

    // Radios throughout sections that use the same 4-value scales:
    //   Never/Sometimes/Often/Always   OR   Poor/Fair/Good/Excellent
    // Instead of listing hundreds of keys, validate by pattern:

    // Fields that use Never/Sometimes/Often/Always
    ...Object.fromEntries([
      // root
      'root_needs','root_nature','root_expression','root_belonging','root_trust',
      // sacral
      'sacral_creativity','sacral_boundaries','sacral_intimacy',
      // solar
      'solar_overextend','solar_gut','solar_celebrate','solar_action','solar_manifest',
      // heart
      'heart_connected','heart_vulnerable',
      // throat
      'throat_creativity','throat_heard',
      // third eye
      'thirdEye_clarity','thirdEye_practices','thirdEye_knowing',
      // crown
      'crown_transcendence','crown_connection','crown_purpose','crown_practices',
      // health & wellness
      'hw_pushThrough','hw_distractions','hw_approval',
      // love & relationships
      'love_prioritize_others','love_unseen','love_sabotage',
      // career/job
      'career_trapped','career_obligation','career_resist','career_perfectionism',
      // time & money
      'timeMoney_balance','timeMoney_hustle','timeMoney_survival'
    ].map(k => [k, Joi.string().valid(...NEVER_SET).required()])),

    // Fields that use Poor/Fair/Good/Excellent
    ...Object.fromEntries([
      // root
      'root_bodycare','root_money',
      // sacral
      'sacral_emotions','sacral_sensuality','sacral_relationships','sacral_change',
      // solar
      'solar_power','solar_purpose',
      // heart
      'heart_express','heart_joy','heart_receive','heart_forgive','heart_selflove',
      // throat
      'throat_listen','throat_no','throat_trust','throat_alignment',
      // third eye
      'thirdEye_reflection','thirdEye_synchronicities','thirdEye_dreams','thirdEye_intuition',
      // crown
      'crown_surrender','crown_stillness','crown_larger_unfolding',
      // health & wellness
      'hw_selfCare','hw_motivation',
      // love & relationships
      'love_transactional',
      // career/job
      'career_value',
      // time & money
      'timeMoney_comfort','timeMoney_investing'
    ].map(k => [k, Joi.string().valid(...QUALITY_SET).required()])),

    // Special radio with sentence values
    love_conflict_response: Joi.string().valid(
      'No, I never do either',
      'Sometimes, I do one of these or both',
      'Often I do one of these or both',
      'Yes, I always do one of these or both'
    ).required(),

    'POST /login': Joi.object({
    _csrf: Joi.string().required(),
    username: jStr(31).required(),
    password: Joi.string().max(72).required()
  }).prefs({ abortEarly: false, stripUnknown: true }),

  // RESET PASSWORD
  'POST /reset/': Joi.object({
    _csrf: Joi.string().required(),
    password: Joi.string().max(72).required(),
    confirm: Joi.string().max(72).required()
  }).prefs({ abortEarly: false, stripUnknown: true }),

  // RESOURCES MGMT — text update (note :id)
  'POST /adminportal/resources/:id/text/update': Joi.object({
    _csrf: Joi.string().required(),
    title: jStr(200).required(),
    videoUrl: jStr(2048).allow(''), // allow empty if optional
    paragraphs: Joi.array().items(jStr(5000)).single().min(1) // was paragraphs[]
  }).prefs({ abortEarly: false, stripUnknown: true }),

  // RESOURCES MGMT — create
  'POST /adminportal/resources/create': Joi.object({
    _csrf: Joi.string().required(),
    overlayText: jStr(500).allow(''),
    buttonText: jStr(100).allow(''),
    buttonUrl: jStr(2048).allow(''),
    imageOption: Joi.string().valid('upload','url').required(),
    imageUpload: jStr(255).allow(''), // filename if multipart; if using multer, you may ignore
    imageUrl: jStr(2048).allow('')
  }).prefs({ abortEarly: false, stripUnknown: true }),

  // RESOURCES MGMT — update image (note :id)
  'POST /adminportal/resources/:id/update': Joi.object({
    _csrf: Joi.string().required(),
    overlayText: jStr(500).allow(''),
    buttonText: jStr(100).allow(''),
    buttonUrl: jStr(2048).allow(''),
    imageOption: Joi.string().valid('upload','url').required(),
    imageUpload: jStr(255).allow(''),
    imageUrl: jStr(2048).allow('')
  }).prefs({ abortEarly: false, stripUnknown: true }),

  // RESOURCES MGMT — delete (note :id)
  'POST /adminportal/resources/:id/delete': Joi.object({
    _csrf: Joi.string().required()
  }).prefs({ abortEarly: false, stripUnknown: true }),

  // CAROUSEL — create
  'POST /adminportal/carousel/create': Joi.object({
    _csrf: Joi.string().required(),
    title: jStr(200).required(),
    buttonText: jStr(100).required(),
    buttonUrl: jStr(2048).required(),
    imageOption: Joi.string().valid('upload','url').required(),
    imageUpload: jStr(255).allow(''),
    imageUrl: jStr(2048).allow(''),
    description: jStr(1000).allow('')
  }).prefs({ abortEarly: false, stripUnknown: true }),

  // CAROUSEL — update (note :id)
  'POST /adminportal/carousel/:id/update': Joi.object({
    _csrf: Joi.string().required(),
    title: jStr(200).required(),
    buttonText: jStr(100).required(),
    buttonUrl: jStr(2048).required(),
    imageOption: Joi.string().valid('upload','url').required(),
    imageUpload: jStr(255).allow(''),
    imageUrl: jStr(2048).allow(''),
    description: jStr(1000).required()
  }).prefs({ abortEarly: false, stripUnknown: true }),

  // CAROUSEL — delete (note :id)
  'POST /adminportal/carousel/:id/delete': Joi.object({
    _csrf: Joi.string().required()
  }).prefs({ abortEarly: false, stripUnknown: true }),

  // CLIENT ADD
  'POST /admin/clients': Joi.object({
    _csrf: Joi.string().required(),
    firstname: jStr(100).required(),
    lastname: jStr(100).required(),
    phonenumber: jStr(20).required(),
    email: Joi.string().lowercase().email({ tlds: false }).max(254).required(),
    closedChakra: Joi.string().valid('root','sacral','solarPlexus','heart','throat','thirdEye','crown').required()
  }).prefs({ abortEarly: false, stripUnknown: true }),

  // CONTENT MGMT — add review
  'POST /admin/add-review': Joi.object({
    _csrf: Joi.string().required(),
    name: jStr(100).required(),
    location: jStr(100).allow(''),
    event: jStr(100).allow(''),
    quote: jStr(2000).required()
  }).prefs({ abortEarly: false, stripUnknown: true }),

  // ASSESSMENT SAVE (dedup _csrf and add conditionals)
  'POST /assessment/save': Joi.object({
    _csrf: Joi.string().required(),

    fullName: jStr(100).required(),
    email: Joi.string().lowercase().email({ tlds: false }).max(254).required(),
    contactNumber: Joi.string().max(20).required(),

    ageBracket: Joi.string().valid('20-30','30-40','40-50','50+').required(),
    healthcareWorker: Joi.string().valid('yes','no').required(),
    healthcareYears: Joi.alternatives().conditional('healthcareWorker', {
      is: 'yes',
      then: Joi.number().integer().min(0).max(80).required(),
      otherwise: Joi.any().strip()
    }),

    jobTitle: jStr(100).required(),

    experience: Joi.string().valid('current','past','no','notSure','other').required(),
    experienceOtherText: Joi.alternatives().conditional('experience', {
      is: 'other',
      then: jStr(200).required(),
      otherwise: Joi.any().strip()
    }),

    familiarWith: Joi.array()
      .items(Joi.string().valid('kundalini','soundBaths','lifeCoaching','eft','none'))
      .single().min(1).required(),

    challenges: Joi.array()
      .items(Joi.string().valid('physical','emotional','mental','spiritual','other'))
      .single().min(1).required(),
    challengeOtherText: Joi.alternatives().conditional('challenges', {
      is: Joi.array().items(Joi.string()).has(Joi.valid('other')),
      then: jStr(200).required(),
      otherwise: Joi.any().strip()
    }),

    // …keep the rest of the radio fields as your generator printed…
  }).prefs({ abortEarly: false, stripUnknown: true }),

  // PRE-QUIZ APPLICATION
  'POST /application': Joi.object({
    _csrf: Joi.string().required(),
    email: Joi.string().lowercase().email({ tlds: false }).max(254).required(),
    fullName: jStr(100).required(),
    contactNumber: jStr(20).required(),
    ageBracket: Joi.string().valid('20-30','30-40','40-50','50+').required(),
    isHealthcareWorker: Joi.string().valid('Yes','No').required(),
    healthcareRole: jStr(100).allow(''),
    healthcareYears: Joi.alternatives().conditional('isHealthcareWorker', {
      is: 'Yes',
      then: Joi.number().integer().min(0).max(80).required(),
      otherwise: Joi.any().strip()
    }),
    jobTitle: jStr(100).required(),
    workedWithPractitioner: Joi.string().valid('Currently working with one','In the past','First time','Not sure','Other').allow(''),
    familiarWith: Joi.array().items(
      Joi.string().valid('Kundalini Yoga','Sound Baths','Life Coaching','Emotional Freedom Technique','None of the above')
    ).single(),
    challenges: Joi.array().items(Joi.string().valid('Physical','Emotional','Mental','Spiritual','Other')).single(),
    challengesOtherText: jStr(200).allow(''),
    experience: jStr(2000).allow(''),
    goals: jStr(2000).required()
  }).prefs({ abortEarly: false, stripUnknown: true }),

  }).prefs({ abortEarly: false, stripUnknown: true }),
};
