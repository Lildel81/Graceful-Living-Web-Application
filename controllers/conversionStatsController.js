/**
 * Conversion Stats Controller
 * This controller provides 2 ways to analyze conversion rates
 * 1. Basic stats
 *  - Calculate conversion rate from actual batabase data
 *  - Work immediately, no setup requirement
 * 
 * 2. ML prediction
 *  - Use trained ML model for prediction
 *  - Requires: python ml_model/ml_api.py on port 5001
 */

// =================== Import dependencies ========================
const ChakraAssessment = require('../models/chakraAssessment')
const Appointment = require('../models/appointment')
const axios = require('axios')

// =================== ML API Configuration ========================
// Use environment variable for ML API URL to support both development and production
// Development: http://localhost:5001
// Production: https://gracefulliving-ml-api.onrender.com (or our Render URL)
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5001'

// =================== Transform assessment data for ML API =================================
// Ensures data structure matches what predict_new.py expects
function transformAssessmentForML(assessment) {
    // Create a clean object with only the fields ML model needs
    return {
        email: assessment.email || '',
        ageBracket: assessment.ageBracket || assessment.age_bracket || '',
        healthcareWorker: assessment.healthcareWorker || assessment.healthcare_worker || 'No',
        healthcareYears: assessment.healthcareYears || assessment.healthcare_years || '',
        challenges: Array.isArray(assessment.challenges) ? assessment.challenges : [],
        familiarWith: Array.isArray(assessment.familiarWith) ? assessment.familiarWith : [],
        goals: assessment.goals || '',
        focusChakra: assessment.focusChakra || assessment.focus_chakra || 'unknown',
        archetype: assessment.archetype || 'unknown',
        scoredChakras: assessment.scoredChakras || assessment.scored_chakras || {},
        scoredLifeQuadrants: assessment.scoredLifeQuadrants || assessment.scored_life_quadrants || {}
    };
}

// ========================== Get comprehensive ML conversion stats =================================
// This function gets ML predictions AND calculates comprehensive conversion statistics
async function getMLConversionStats(options = {}) {
    const { daysBack = 90, limit = 50, verbose = true } = options;
    
    const log = (msg) => verbose && console.log(msg);
    
    try {
        // log('\n' + '='.repeat(60));
        // log('🤖 ML CONVERSION STATS - Starting...');
        // log('='.repeat(60));
        
        // // Step 1: Check ML API health
        // log('🔍 Step 1: Checking ML API health...');
        // log(`   Connecting to: ${ML_API_URL}`);
        const healthCheck = await axios.get(`${ML_API_URL}/health`, {timeout: 2000});
        // log('✅ ML API Response:', healthCheck.data);
        
        if(healthCheck.data.status !== 'ok'){
            throw new Error('ML model not ready');
        }

        // Step 2: Get model information
        // log('🔍 Step 2: Getting model info...');
        const modelInfo = await axios.get(`${ML_API_URL}/model/info`, {timeout: 2000});
        // log('✅ Model Info:', {
        //     type: modelInfo.data.model_type,
        //     features: modelInfo.data.num_features,
        //     training_samples: modelInfo.data.training_samples
        // });

        // Step 3: Get recent assessments to predict
        // log(`🔍 Step 3: Querying assessments from last ${daysBack} days...`);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);
        // log(`   Looking for assessments since: ${cutoffDate.toISOString()}`);

        const recentAssessments = await ChakraAssessment.find({
            createdAt: {$gte: cutoffDate}
        }).limit(limit).lean();
        
        // log(`✅ Found ${recentAssessments.length} recent assessments`);
        
        // if (recentAssessments.length > 0 && verbose) {
        //     log('   Sample assessment structure:', {
        //         hasEmail: !!recentAssessments[0].email,
        //         hasAgeBracket: !!recentAssessments[0].ageBracket,
        //         hasScoredChakras: !!recentAssessments[0].scoredChakras,
        //         hasScoredLifeQuadrants: !!recentAssessments[0].scoredLifeQuadrants,
        //         hasFocusChakra: !!recentAssessments[0].focusChakra,
        //         hasArchetype: !!recentAssessments[0].archetype
        //     });
        // }

        // // Step 4: Get basic stats from database
        // log('📊 Step 4: Fetching basic conversion stats from database...');
        const basicStats = await getBasicConversionStats();
        
        // Step 5: Get ML predictions if we have recent assessments
        let mlPredictions = null;
        let highProbabilityLeads = 0;
        let conversionStats = null;
        
        if (recentAssessments.length > 0) {
            // log(`🤖 Step 5: Sending ${recentAssessments.length} assessments to ML API...`);
            
            // // Log first assessment to debug data structure
            // if (verbose && recentAssessments[0]) {
            //     log('   First assessment sample:', {
            //         email: recentAssessments[0].email,
            //         ageBracket: recentAssessments[0].ageBracket,
            //         healthcareWorker: recentAssessments[0].healthcareWorker,
            //         hasResults: !!recentAssessments[0].results,
            //         hasScoredChakras: !!recentAssessments[0].scoredChakras,
            //         hasScoredLifeQuadrants: !!recentAssessments[0].scoredLifeQuadrants
            //     });
            // }
            
            try {
                // Transform assessments to match ML API expected format
                // log(`   🔄 Transforming ${recentAssessments.length} assessments for ML API...`);
                
                let transformedAssessments;
                try {
                    transformedAssessments = recentAssessments.map(assessment => transformAssessmentForML(assessment));
                    // log(`   ✅ Successfully transformed ${transformedAssessments.length} assessments`);
                    
                    // Log first transformed assessment structure
                    // if (verbose && transformedAssessments[0]) {
                    //     log('   📋 Transformed assessment sample:', {
                    //         email: transformedAssessments[0].email ? '✓' : '✗',
                    //         ageBracket: transformedAssessments[0].ageBracket ? '✓' : '✗',
                    //         healthcareWorker: transformedAssessments[0].healthcareWorker ? '✓' : '✗',
                    //         challenges: `${transformedAssessments[0].challenges.length} items`,
                    //         familiarWith: `${transformedAssessments[0].familiarWith.length} items`,
                    //         focusChakra: transformedAssessments[0].focusChakra,
                    //         archetype: transformedAssessments[0].archetype
                    //     });
                    // }
                    
                    // Check payload size
                    const payloadSize = JSON.stringify(transformedAssessments).length;
                    // log(`   📦 Payload size: ${(payloadSize / 1024).toFixed(2)} KB`);
                    
                    if (payloadSize > 10 * 1024 * 1024) { // 10MB
                        // log(`   ⚠️  Payload too large, reducing batch size...`);
                        transformedAssessments = transformedAssessments.slice(0, 20);
                        // log(`   📦 Reduced to ${transformedAssessments.length} assessments`);
                    }
                } catch (transformError) {
                    // log(`   ❌ Transformation error: ${transformError.message}`);
                    throw new Error(`Cannot transform assessment data: ${transformError.message}`);
                }
                
                // Test with single assessment first
                // log(`   🧪 Testing with single assessment first...`);
                try {
                    await axios.post(
                        `${ML_API_URL}/predict`,
                        transformedAssessments[0],
                        {
                            timeout: 10000,
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        }
                    );
                    // log(`   ✅ Single assessment test passed!`);
                } catch (singleTestError) {
                    // log(`   ❌ Single assessment test failed: ${singleTestError.message}`);
                    if (singleTestError.response) {
                        // log(`      Status: ${singleTestError.response.status}`);
                        // log(`      Error: ${JSON.stringify(singleTestError.response.data)}`);
                    }
                    throw new Error(`ML API cannot process assessment format: ${singleTestError.message}`);
                }
                
                // Now send batch
                // log(`   🌐 Sending batch of ${transformedAssessments.length} assessments to ML API...`);
                
                const predictionsResponse = await axios.post(
                    `${ML_API_URL}/predict/batch`,
                    transformedAssessments,
                    {
                        timeout: 30000,  // 30 seconds
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    }
                );

                // log(`   📥 Received response from ML API`);
                // log(`   🔍 Response structure:`, {
                //     success: predictionsResponse.data.success,
                //     hasPredictions: !!predictionsResponse.data.predictions,
                //     hasPrediction: !!predictionsResponse.data.prediction,
                //     keys: Object.keys(predictionsResponse.data)
                // });
                
                if (predictionsResponse.data.success){
                    // Handle both 'predictions' (batch) and 'prediction' (single)
                    mlPredictions = predictionsResponse.data.predictions || predictionsResponse.data.prediction;
                    
                    if (!mlPredictions) {
                        // log(`   ⚠️  Warning: Response has success=true but no predictions data`);
                        // log(`   Full response:`, JSON.stringify(predictionsResponse.data, null, 2));
                        throw new Error('ML API returned success but no predictions data');
                    }
                    
                    // Ensure it's an array
                    if (!Array.isArray(mlPredictions)) {
                        // log(`   ⚠️  Predictions is not an array, converting...`);
                        mlPredictions = [mlPredictions];
                    }
                    
                    // log(`✅ Received ${mlPredictions.length} ML predictions`);
                
                    // Count high probability leads (70%+)
                    highProbabilityLeads = mlPredictions.filter(
                        p => p.conversion_probability >= 0.7
                    ).length;
                // log(`🎯 Found ${highProbabilityLeads} high-probability leads (70%+)`);
                
                // Calculate average conversion probability
                const avgProb = mlPredictions.length > 0
                    ? mlPredictions.reduce((sum, p) => sum + p.conversion_probability, 0) / mlPredictions.length
                    : 0;

                // Build comprehensive stats combining ML + database
                conversionStats = {
                    conversionRate: basicStats ? basicStats.conversionRate : avgProb,
                    totalConversions: basicStats ? basicStats.totalConversions : highProbabilityLeads,
                    totalAssessments: basicStats ? basicStats.totalAssessments : recentAssessments.length,
                    recentAssessments: recentAssessments.length,
                    recentConversions: basicStats ? basicStats.recentConversions : highProbabilityLeads,
                    highProbabilityCount: highProbabilityLeads,
                    avgConversionProbability: avgProb,
                    avgConversionDays: basicStats ? basicStats.avgConversionDays : null,
                    topFactors: [{
                        category: 'ML Model',
                        description: `Model trained on ${modelInfo.data.training_samples || 'N/A'} samples with ${recentAssessments.length} recent assessments analyzed`
                    }]
                };
                // log('✅ ML conversion stats built successfully');
                } else {
                    // API returned success: false
                    // log('⚠️  ML API returned success=false');
                    // log('   Error from ML API:', predictionsResponse.data.error || 'No error message provided');
                    // log('   Full response:', JSON.stringify(predictionsResponse.data, null, 2));
                    throw new Error(`ML API processing failed: ${predictionsResponse.data.error || 'Unknown error'}`);
                }
            } catch (predictionError) {
                // log('❌ Error calling ML prediction API:', predictionError.message);
                
                // if (predictionError.response) {
                //     // Server responded with error status
                //     log('   📡 Server Response Error:');
                //     log('      Status:', predictionError.response.status);
                //     log('      Status Text:', predictionError.response.statusText);
                //     log('      Data:', JSON.stringify(predictionError.response.data, null, 2));
                // } else if (predictionError.request) {
                //     // Request was made but no response
                //     log('   📡 No response received from ML API');
                //     log('      Request config:', {
                //         url: predictionError.config?.url,
                //         method: predictionError.config?.method,
                //         timeout: predictionError.config?.timeout
                //     });
                // } else {
                //     // Error in request setup
                //     log('   ⚙️  Request setup error:');
                //     log('      Message:', predictionError.message);
                //     log('      Code:', predictionError.code);
                //     log('      Name:', predictionError.name);
                //     if (predictionError.stack) {
                //         log('      Stack trace (first 3 lines):');
                //         const stackLines = predictionError.stack.split('\n').slice(0, 3);
                //         stackLines.forEach(line => log('         ' + line));
                //     }
                // }
                // Don't throw - let it continue to use basic stats
            }
        } else {
            // log('⚠️  No recent assessments - using historical stats only');
            
            // No recent assessments but ML API is running
            if (basicStats) {
                conversionStats = {
                    ...basicStats,
                    recentAssessments: 0,
                    recentConversions: 0,
                    highProbabilityCount: 0,
                    avgConversionProbability: 0,
                    topFactors: [{
                        category: 'Historical Data',
                        description: 'Based on past conversions - no recent assessments to predict'
                    }]
                };
                // log('✅ Using historical/basic stats');
            }
        }

        return {
            success: true,
            conversionStats,
            mlPredictions,
            highProbabilityLeads,
            recentAssessmentsCount: recentAssessments.length
        };
        
    } catch (error) {
        // log('❌ ML API not available:', error.message);
        
        // Fallback to basic stats
        try {
            const basicStats = await getBasicConversionStats();
            if (basicStats) {
                // log('✅ Falling back to basic database stats');
                return {
                    success: false,
                    mlApiAvailable: false,
                    conversionStats: {
                        ...basicStats,
                        highProbabilityCount: 0,
                        topFactors: [{
                            category: 'Database Analysis',
                            description: 'Real conversion data from quiz submissions and appointments'
                        }]
                    },
                    mlPredictions: null,
                    highProbabilityLeads: 0,
                    error: error.message
                };
            }
        } catch (fallbackErr) {
            // log('❌ Failed to get basic stats:', fallbackErr.message);
        }
        
        return {
            success: false,
            mlApiAvailable: false,
            conversionStats: null,
            mlPredictions: null,
            highProbabilityLeads: 0,
            error: error.message
        };
    }
}

// ========================== Calculate basic conversion from db =================================
async function getBasicConversionStats() {
    try {
        // Step 1: Load all assessments and appointments from db
        const assessments = await ChakraAssessment.find().lean();
        const appointments = await Appointment.find().lean();

        // Defensive check: ensure we have arrays
        if (!Array.isArray(assessments) || !Array.isArray(appointments)) {
            console.warn('Assessments or appointments data is not an array');
            return null;
        }

        // Step 2: Track conversions
        let conversions = 0;
        let conversionDays = [];

        // Step 3: Loop thru each assessment and check if user converted
        for (const assessment of assessments){
            const assessmentEmail = (assessment.email || '').toLowerCase().trim();
            const assessmentDate = assessment.createdAt || assessment.submittedAt;

            if (!assessmentEmail || !assessmentDate) continue;

            // Step 4: Find appt for this user
            const matchingAppointments = appointments.filter(apt => {
                const aptEmail = (apt.clientEmail || '').toLowerCase().trim();
                const aptDate = apt.createdAt;

                return aptEmail === assessmentEmail && aptDate && aptDate >= assessmentDate;
            });

            // Step 5: If found matching appt, user converted
            if (matchingAppointments.length > 0){
                conversions++;

                const matchDate = new Date(matchingAppointments[0].createdAt);
                const assessDate = new Date(assessmentDate);

                const daysDiff = Math.round((matchDate - assessDate)/(1000*60*60*24));

                if(daysDiff >= 0 && daysDiff <= 90){
                    conversionDays.push(daysDiff);
                }
            }
        }

        // Step 6: calcualte overall conversion rate
        const conversionRate = assessments.length > 0 ? conversions/assessments.length : 0;

        // Step 7: Calculate recent activity
        const recentCutoff = new Date();
        recentCutoff.setDate(recentCutoff.getDate() - 90);

        // Count assessments created in last 90 days
        const recentAssessments = assessments.filter(a => {
            const assessDate = a.createdAt || a.submittedAt;
            return assessDate && new Date(assessDate) >= recentCutoff;
        }).length;

        // Get appointments created in last 90 days
        const recentAppointments = Array.isArray(appointments) ? appointments.filter(a => {
            return a.createdAt && new Date(a.createdAt) >= recentCutoff;
        }) : [];

        // Count conversion from recent assessment
        let recentConversions = 0;
        for (const assessment of assessments){
            const assessmentEmail = (assessment.email || '').toLowerCase().trim();
            const assessmentDate = assessment.createdAt || assessment.submittedAt;

            if (!assessmentEmail || !assessmentDate) continue;

            const matching = recentAppointments.find(apt => {
                const aptEmail = (apt.clientEmail || '').toLowerCase().trim();
                return aptEmail === assessmentEmail && apt.createdAt >= assessmentDate;
            });

            if (matching) recentConversions++;
        }

        // Step 8: Calcualte average conversion days
        const avgConversionDays = conversionDays.length > 0
            ? conversionDays.reduce((a, b) => a+b, 0)/ conversionDays.length
            : null;
        
        // Step 9: return all calculated stats
        return {
            conversionRate,
            totalConversions: conversions,
            totalAssessments: assessments.length,
            recentAssessments,
            recentConversions,
            avgConversionDays
        }
    }
    catch (error){
        console.error('ERROR calculating basic conversion stats: ', error);
        return null;
    }
}

module.exports = {
    getMLConversionStats,  // Comprehensive ML stats function
    getBasicConversionStats
};