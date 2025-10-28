# Make prediction on new chakra assessment data
# Use the trained model (created by train_model.py) to make
# prediction on new assessment data

# Import libraries
import os
import joblib
import pandas as pd
import numpy as np

# ================================== Conversion prediction service class =============================
# This class handles loading the trained model and making prediction

class ConversionPredictorService:
    def __init__(self, model_path='best_conversion_model.pkl', scaler_path='scaler.pkl', features_path='features_names.pkl'):
        # Get directory of this script
        base_dir = os.path.dirname(__file__)

        # Construct full path to the saved files
        self.model_path = os.path.join(base_dir, model_path)
        self.scaler_path = os.path.join(base_dir, scaler_path)
        self.features_path = os.path.join(base_dir, features_path)

        # Load trained model
        self.model = joblib.load(model_path)

        # Load scaler
        self.scaler = joblib.load(scaler_path)

        # Load feature names
        self.feature_names = joblib.load(features_path)

        # Signal done loading model
        print("Model loaded successfully")

    # ============================ Preprocess assessment ================================
    def preprocess_assessment(self, assessment_data):
        # Dictionary to hold features
        features = {}

        #------------- Demographic features -----------------
        # Must be exactly match with data_extraction.py

        # Age groups
        age_map = {
            '18-20': 1, # There is no 18-20 in out db but I think we should include it
            '20-30': 2,
            '30-40': 3,
            '40-50': 4,
            '50+': 5
        }

        age_bracket = assessment_data.get('ageBracket', '')
        features['age_bracket_number'] = age_map.get(age_bracket, 0)

        # Healthcare worker - 0 or 1
        features['is_healthcare_worker'] = 1 if assessment_data.get('healthcareWorker') == 'Yes' else 0

        # Healthcare years: convert experience to number
        years_map = {
            '0-3 years': 1,
            '4-7 years': 2,
            '8-11 years': 3,
            '12-16 years': 4,
            '16+ years': 5
        }

        healthcare_years = assessment_data.get('healthcareYears', '')
        features['healthcare_years_numeric'] = years_map.get(healthcare_years, 0)

        # -------------- Engagement features ----------------------
        # Number of challenges selected
        challenges = assessment_data.get('challenges', [])
        features['num_challenges'] = len(challenges) if isinstance(challenges, list) else 0

        # Number of familiar practices
        familiar = assessment_data.get('familiarWith', [])
        features['num_familiar'] = len(familiar) if isinstance(familiar, list) else 0

        # Has set goals
        features['has_goals'] = 1 if assessment_data.get('goals') else 0

        # ---------------- Chakra score features --------------------
        scored_chakras = assessment_data.get('scoredChakras', {})
        chakra_names = [
            'rootChakra', 'sacralChakra', 'solarPlexusChakra',
            'heartChakra', 'throatchakra', 'thirdEyeChakra', 'crownChakra'
        ]

        # Process each chakra
        for chakra in chakra_names:
            # Get data for this chara (empty dict{} if not found)
            chakra_data = scored_chakras.get(chakra, {})

            # Check if chara_data is a dictionary (expected format)
            if isinstance(chakra_data, dict):
                # Extract all score vals from the nested structure
                scores = [item.get('score', 0) for item in chakra_data.values()
                          if isinstance(item, dict) and 'score' in item]
                
                # Calculate avg score - 0 if no scores
                features[f'{chakra}_avg'] = sum(scores)/len(scores) if scores else 0

                # Store count of answered questions for this chakra
                features[f'{chakra}_count'] = len(scores)
            else:
                # If data format is unexpected, use default value of 0
                features[f'{chakra}_avg'] = 0
                features[f'{chakra}_count'] = 0

        # -------------- Life quadrant score features -------------------
        scored_quadrants = assessment_data.get('scoredLifeQuadrants', {})
        # List of 4 life quadrant names
        quadrant_names = [
            'healthWellness', 'loveRelationships', 'careerJob', 'timeMoney'
        ]

        # Process each quadrant
        for quadrant in quadrant_names:
            # Get data for this quadrant
            quadrant_data = scored_quadrants.get(quadrant, {})

            # Check if data is in expected format
            if isinstance(quadrant_data, dict):
                # Extract all scores
                scores = [item.get('score', 0) for item in quadrant_data.values()
                          if isinstance(item, dict) and 'score' in item]
                
                # Calculate and store avg count
                features[f'{quadrant}_avg'] = sum(scores)/len(scores) if scores else 0
                features[f'{quadrant}_count'] = len(scores)
            else:
                features[f'{quadrant}_avg'] = 0
                features[f'{quadrant}_count'] = 0

        # ---------------------------- Categorical feature (OHE) ---------------------

        # Focus chakra
        focus_chakra = assessment_data.get('focusChakra', 'unknown')

        for col in self.feature_names:
            if col.startswith('focus_chakra_'):
                # Extract the chakra name
                chakra_value = col.replace('focus_chakra_', '')
                # Set to 1 if this is the focus chakra, else 0
                features[col] = 1 if focus_chakra == chakra_value else 0
        
        # Archetype
        archetype = assessment_data.get('archetype', 'unknown')

        for col in self.feature_names:
            if col.startswith('archetype_'):
                archetype_value = col.replace('archetype_', '')
                features[col] = 1 if archetype == archetype_value else 0
        
        # ------------------------------ Create DataFrame --------------------------------
        df = pd.DataFrame([features])
        
        # Ensure all features present
        for feature in self.feature_names:
            if feature not in df.columns:
                df[feature] = 0
        
        # Reorder cols to match training feature order
        df = df[self.feature_names]

        # Return preprocessed df ready for prediction
        return df
    
    # =============================== Prediction method ===================================
    def predict_conversion_probability(self, assessment_data):
        # Step 1: preprocess data
        X = self.preprocess_assessment(assessment_data)

        # Step 2: scale the features
        X_scaled = self.scaler.transform(X) # Use transform (not fit_transform) bcz fit_transfrom for training data, not for new data

        # Step 3: make prediction
        prediction = self.model.predict(X_scaled)[0]        # Return binary
        probability = self.model.predict_proba(X_scaled)[0] # Return [proba_class_0, proba_class_1]

        # Step 4: package results in friendly format
        result = {
            # Binary prediction: 1- true, 0- false
            'will_convert': bool(prediction),

            # Probability of converstion
            'conversion_probability': float(probability[1]),

            # Confidence
            'confidence': float(max(probability)),

            # Risk level for business use
            'risk_level': self._get_risk_level(probability[1])
        }

        return result
    
    # --------------------- Helper function ____________________
    # Because raw probability is difficult for non-tech people to act on
    # Risk level like High (70%+) very likely to book appt
    # Business owner can have some action to boost to book appt
    # such as follow-up text/call, send booking link
    def _get_risk_level(self, probability):
        if probability >=0.7:
            return "High - Very likely to book"
        elif probability >= 0.5:
            return "Medium-High - Likely to book"
        elif probability >= 0.3:
            return "Medium - May book with followup"
        else:
            return "Low - Unlikely to book without intervention"
    
    # ====================== Multiple prediction at once ============================
    # This can handle multiple new assessment result (no overhead of looping thru each data)

    def predict_batch (self, assessments_list):
        results = []

        # Loop thru each assessment in a list
        for assessment in assessments_list:
            try:
                # Get prediction for this assessment
                result = self.predict_conversion_probability(assessment)

                # Add email to result so we track which one is which
                result['email'] = assessment.get('email', 'unknown')

                # Add result to the list
                results.append(result)
            except Exception as e:
                print(f"ERROR predicting for assessment: {e}")
                continue
        
        return results
    

#######################################
# Need to develop this more to get new assessment in DB to predict


