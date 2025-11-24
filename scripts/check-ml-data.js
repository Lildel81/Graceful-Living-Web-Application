/**
 * ML Data Diagnostic Script
 * 
 * This script checks if you have the necessary data for ML predictions
 * Run: node scripts/check-ml-data.js
 */

const mongoose = require('mongoose');
const ChakraAssessment = require('../models/chakraAssessment');
const Appointment = require('../models/appointment');

// Load environment config
require('../startup/config')();

async function checkMLData() {
  try {
    // console.log('\n' + '='.repeat(70));
    // console.log('🔍 ML DATA DIAGNOSTIC TOOL');
    // console.log('='.repeat(70) + '\n');

    // // Connect to MongoDB
    // console.log('📡 Connecting to MongoDB...');
    const dbUri = process.env.MONGODB_URI || process.env.DB_CONNECTION_STRING;
    if (!dbUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    await mongoose.connect(dbUri);
    // console.log('✅ Connected to MongoDB\n');

    // Check assessments
    // console.log('─'.repeat(70));
    // console.log('📊 CHAKRA ASSESSMENTS');
    // console.log('─'.repeat(70));
    
    const totalAssessments = await ChakraAssessment.countDocuments();
    // console.log(`Total assessments: ${totalAssessments}`);
    
    if (totalAssessments === 0) {
      // console.log('❌ No assessments found! Users need to take the chakra quiz.');
    } else {
      // Check recent assessments (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const recentCount = await ChakraAssessment.countDocuments({
        createdAt: { $gte: ninetyDaysAgo }
      });
      
      // console.log(`Recent assessments (last 90 days): ${recentCount}`);
      
      if (recentCount === 0) {
        // console.log('⚠️  No assessments in the last 90 days!');
        // console.log('   ML predictions require recent data.');
        // console.log('   Options:');
        // console.log('   1. Wait for users to take the quiz');
        // console.log('   2. Use older data by adjusting the date range');
        
        // Show when the most recent assessment was
        const mostRecent = await ChakraAssessment.findOne()
          .sort({ createdAt: -1 })
          .lean();
        
        if (mostRecent) {
          // console.log(`\n   Most recent assessment: ${mostRecent.createdAt}`);
          const daysAgo = Math.floor((Date.now() - new Date(mostRecent.createdAt)) / (1000 * 60 * 60 * 24));
          // console.log(`   That was ${daysAgo} days ago`);
        }
      } else {
        // console.log('✅ Recent assessments available for ML prediction!');
        
        // Check structure of one assessment
        const sample = await ChakraAssessment.findOne({
          createdAt: { $gte: ninetyDaysAgo }
        }).lean();
        
        // console.log('\n📋 Sample Assessment Structure:');
        // console.log(`   Email: ${sample.email ? '✅' : '❌'}`);
        // console.log(`   Age Bracket: ${sample.ageBracket ? '✅' : '❌'}`);
        // console.log(`   Healthcare Worker: ${sample.healthcareWorker !== undefined ? '✅' : '❌'}`);
        // console.log(`   Scored Chakras: ${sample.scoredChakras ? '✅' : '❌'}`);
        // console.log(`   Scored Life Quadrants: ${sample.scoredLifeQuadrants ? '✅' : '❌'}`);
        // console.log(`   Focus Chakra: ${sample.focusChakra ? '✅' : '❌'}`);
        // console.log(`   Archetype: ${sample.archetype ? '✅' : '❌'}`);
        // console.log(`   Challenges: ${sample.challenges ? '✅' : '❌'}`);
        // console.log(`   Familiar With: ${sample.familiarWith ? '✅' : '❌'}`);
        
        // Show email sample
        // if (sample.email) {
        //   // console.log(`\n   Sample email: ${sample.email}`);
        // }
      }
    }

    // Check appointments
    // console.log('\n' + '─'.repeat(70));
    // console.log('📅 APPOINTMENTS');
    // console.log('─'.repeat(70));
    
    const totalAppointments = await Appointment.countDocuments();
    // console.log(`Total appointments: ${totalAppointments}`);
    
    if (totalAppointments === 0) {
      // console.log('⚠️  No appointments found!');
      // console.log('   Conversion rate calculations need appointment data.');
    } else {
      // Check recent appointments
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const recentAppts = await Appointment.countDocuments({
        createdAt: { $gte: ninetyDaysAgo }
      });
      
      // console.log(`Recent appointments (last 90 days): ${recentAppts}`);
      
      // // Check appointment structure
      // const sampleAppt = await Appointment.findOne().lean();
      // if (sampleAppt) {
      //   // console.log('\n📋 Sample Appointment Structure:');
      //   // console.log(`   Client Email: ${sampleAppt.clientEmail ? '✅' : '❌'}`);
      //   // console.log(`   Created At: ${sampleAppt.createdAt ? '✅' : '❌'}`);
        
      //   if (sampleAppt.clientEmail) {
      //     console.log(`\n   Sample email: ${sampleAppt.clientEmail}`);
      //   }
      // }
    }

    // Calculate conversion rate if data exists
    if (totalAssessments > 0 && totalAppointments > 0) {
      // console.log('\n' + '─'.repeat(70));
      // console.log('📈 CONVERSION ANALYSIS');
      // console.log('─'.repeat(70));
      
      let conversions = 0;
      const assessments = await ChakraAssessment.find().lean();
      const appointments = await Appointment.find().lean();
      
      for (const assessment of assessments) {
        const assessmentEmail = (assessment.email || '').toLowerCase().trim();
        if (!assessmentEmail) continue;
        
        const hasAppointment = appointments.some(apt => {
          const aptEmail = (apt.clientEmail || '').toLowerCase().trim();
          return aptEmail === assessmentEmail;
        });
        
        if (hasAppointment) conversions++;
      }
      
      // const conversionRate = (conversions / totalAssessments * 100).toFixed(1);
      // // console.log(`Conversions: ${conversions} out of ${totalAssessments}`);
      // // console.log(`Conversion Rate: ${conversionRate}%`);
      
      // if (conversions === 0) {
      //   console.log('\n⚠️  No conversions detected!');
      //   console.log('   Possible reasons:');
      //   console.log('   1. Email addresses don\'t match between assessments and appointments');
      //   console.log('   2. No users who took the quiz have booked appointments yet');
      //   console.log('   3. Different email formats (case sensitivity, spacing)');
      // } else {
      //   console.log(`\n✅ ${conversions} conversions detected!`);
      // }
    }

    // Summary
    // console.log('\n' + '='.repeat(70));
    // console.log('📊 SUMMARY');
    // console.log('='.repeat(70));
    
    const issues = [];
    const warnings = [];
    
    if (totalAssessments === 0) {
      issues.push('No chakra assessments in database');
    }
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const recentCount = await ChakraAssessment.countDocuments({
      createdAt: { $gte: ninetyDaysAgo }
    });
    
    if (recentCount === 0 && totalAssessments > 0) {
      warnings.push('No assessments in last 90 days - ML predictions will use historical data only');
    }
    
    if (totalAppointments === 0) {
      warnings.push('No appointments - conversion rate cannot be calculated');
    }
    
    if (issues.length === 0 && warnings.length === 0) {
      // console.log('✅ All checks passed! Your data is ready for ML predictions.');
    } else {
      if (issues.length > 0) {
        // console.log('\n❌ Critical Issues:');
        issues.forEach(issue => console.log(`   - ${issue}`));
      }
      if (warnings.length > 0) {
        // console.log('\n⚠️  Warnings:');
        warnings.forEach(warning => console.log(`   - ${warning}`));
      }
    }
    
    // console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    // console.log('📡 MongoDB connection closed\n');
  }
}

// Run the diagnostic
checkMLData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });


