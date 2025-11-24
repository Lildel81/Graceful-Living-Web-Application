# Data extraction
# This script connects to MongoDB database and create a labled data
# Workflow:
# - Connects to MongoDB: extract chakraassessments and appointments
# - Links them together by email to create conversion labels
# - Transforms data into features that ML models can understand
# - Save to csv file for model training
#

# Import libraries
import os
from pymongo import MongoClient             # To connect to MongoDB database
from datetime import datetime, timedelta    # For working with dates and times
from dotenv import load_dotenv              # To load sensitive info from .env file
import pandas as pd

# Load env variable
load_dotenv()

# Data extractor class to get data from MongoDB
class DataExtractor:
    # ================== Constructor -  Setup connection to DB=======================
    def __init__(self, mongodb_uri=None):
        # Get Mongodb_uri from env or if provided
        self.mongodb_uri = mongodb_uri or os.getenv('MONGO_URI')    

        # If no URI found, stop and show error
        if not self.mongodb_uri:
            raise ValueError("MONGO_URI not found. Need to set it in env file")
        
        # Connect to MongDB
        # self.client() creates a connection that can access the db
        # tlsAllowInvalidCertificates=True to bypass SSL cert verification
        self.client = MongoClient(self.mongodb_uri, tlsAllowInvalidCertificates=True)

        # Get db from the connection
        self.db = self.client.get_database()

        # Confirm that we connect to the db
        # print(f"Connected to MongoDB: {self.db.name}")

    # ================= chakraassessments extraction - get raw data from DB =============
    def extract_chakra_assessments(self):
        # Get assessments data and convert to list
        assessments = list(self.db.chakraassessments.find())

        # Confirm found assessemnts
        # print(f"Found {len(assessments)} assessments")
        return assessments
    
    # ================ appointments extraction - get raw data from DB ====================
    def extract_appointments(self):
        # Get appointments data and convert to list
        appointments = list(self.db.appointments.find())

        # Confirm found appointments
        # print(f"Found {len(appointments)} appointments")
        return appointments
    
    # =============== Conversion checking - create target col ============================
    # Check if user who took the assessment booked an appointment within 90 days (can change this)
    # If YES - return 1
    # If NO - return 0
    def check_conversion(self, assessment_email, assessment_date, appointments_df):
        # If there's no appointment, cannot have converted
        # Note FOR IMPROVING LATER: provide different appearance in admin portal
        if appointments_df.empty:
            return 0
        
        # step 1: Find appointments with matching email with assessment
        user_appointments = appointments_df[
            appointments_df['clientEmail'].str.lower() == assessment_email.lower()
        ]

        # If this user has not booked any appointment, return 0
        if user_appointments.empty:
            return 0
        
        # Step 2: Check if booking happened within 90 days
        cutoff_date = assessment_date + timedelta(days=90)

        # Loop thru all appt this user made
        # _, apt means we don't need the index, only the appt data
        for _, apt in user_appointments.iterrows():
            if apt['createdAt'] >= assessment_date and apt['createdAt'] <= cutoff_date:
                return 1
            
        # If all appt were not in the window time, return 0
        return 0
    
    # ================== Features extraction =======================
    # To transform raw assessment data into numerical features

    # ------------ Method 1: extract chakra scores -----------------
    # - Take the nested chakra data from MongoDB
    # - Calculate avg score for each chakra
    # - Count # of quesions were answered per chakra
    # - Return numeric features
    # scored_chakras: Dictionary with chakra names and their question scores
    def extract_chakra_scores(self, scored_chakras):
        # Initialize empty dictionary to store features
        chakra_features = {}

        # If no chakra data, return empty features
        if not scored_chakras:
            return chakra_features
        
        # List of 7 chakra names
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
                chakra_features[f'{chakra}_avg'] = sum(scores)/len(scores) if scores else 0

                # Store count of answered questions for this chakra
                chakra_features[f'{chakra}_count'] = len(scores)
            else:
                # If data format is unexpected, use default value of 0
                chakra_features[f'{chakra}_avg'] = 0
                chakra_features[f'{chakra}_count'] = 0

        # Return dictionary with all chakra features
        return chakra_features
    
    # Extract avg scores from life quadrants - 4 life quadrants
    # Calculate avg scores and counts for each quadrant
    # scored_quadrants: dictionary with quadrant names and their questions scores
    def extract_life_quadrant_scores(self, scored_quadrants):
        # Initialized empty dictionary to store features
        quadrant_features = {}

        # If no quadrant data, return empty features
        if not scored_quadrants:
            return quadrant_features
        
        # List of 4 life quadrant names
        quadrant_names = [
            'healthWellness', 'loveRelationships', 'careerJob', 'timeMoney'
        ]

        # Process each quadrant
        for quadrant in quadrant_names:
            # Get data for this quadrant
            quadrant_data = scored_quadrants.get(quadrant, {})

            # Check if data is in expected format
            if isinstance(quadrant, dict):
                # Extract all scores
                scores = [item.get('score', 0) for item in quadrant_data.values()
                          if isinstance(item, dict) and 'score' in item]
                
                # Calculate and store avg count
                quadrant_features[f'{quadrant}_avg'] = sum(scores)/len(scores) if scores else 0
                quadrant_features[f'{quadrant}_count'] = len(scores)
            else:
                quadrant_features[f'{quadrant}_avg'] = 0
                quadrant_features[f'{quadrant}_count'] = 0
        
        return quadrant_features
    
    # ================= Dataset creation ========================================
    # Combine everything to create a dataset
    def create_dataset(self):
        # Step 1: extract raw db: chakraassessments and appointments
        assessments = self.extract_chakra_assessments()
        appointments = self.extract_appointments()

        # Step 2: convert appointments to pandas df => easy to filer and search data
        appointments_df = pd.DataFrame(appointments)

        # Convert 'createdAt' to datetime format for date comparision
        if not appointments_df.empty and 'createdAt' in appointments_df.columns:
            appointments_df['createdAt'] = pd.to_datetime(appointments_df['createdAt'])

        # Step 3: build feature dataset
        dataset = []

        # Step 4: loop through each assessment and extract features
        for assessment in assessments:
            try:
                features = {
                    'email': assessment.get('email',''),
                    'assessment_date': assessment.get('createdAt', datetime.now())
                }

                # -------- Demographic features -------
                
                # Age groups
                age_map = {
                    '18-20': 1, # There is no 18-20 in out db but I think we should include it
                    '20-30': 2,
                    '30-40': 3,
                    '40-50': 4,
                    '50+': 5
                }

                age_bracket = assessment.get('ageBracket', '')
                features['age_bracket_number'] = age_map.get(age_bracket, 0)

                # Healthcare worker - 0 or 1
                features['is_healthcare_worker'] = 1 if assessment.get('healthcareWorker') == 'Yes' else 0

                # Healthcare years: convert experience to number
                years_map = {
                    '0-3 years': 1,
                    '4-7 years': 2,
                    '8-11 years': 3,
                    '12-16 years': 4,
                    '16+ years': 5
                }

                healthcare_years = assessment.get('healthcareYears', '')
                features['healthcare_years_numeric'] = years_map.get(healthcare_years, 0)

                # ------------ Engagement features --------------

                # Number of challenges selected
                challenges = assessment.get('challenges', [])
                features['num_challenges'] = len(challenges) if isinstance(challenges, list) else 0

                # Number of familiar practices
                familiar = assessment.get('familiarWith', [])
                features['num_familiar'] = len(familiar) if isinstance(familiar, list) else 0

                # Has set goals
                features['has_goals'] = 1 if assessment.get('goals') else 0

                # ------------- Chakra scores ------------------------
                scored_chakras = assessment.get('scoredChakras', {})
                chakra_features = self.extract_chakra_scores(scored_chakras)
                # Add all chakra features to features dict
                features.update(chakra_features)

                # ------------- Life quadrant scores ------------------
                scored_quadrants = assessment.get('scoredLifeQuadrants', {})
                quadrant_features = self.extract_life_quadrant_scores(scored_quadrants)
                features.update(quadrant_features)

                # ------------- Categorical features ------------------
                # Need to use OHE  during training

                # Focus chakra
                features['focus_chakra'] = assessment.get('focusChakra', 'unknown')

                # Archetype
                features['archetype'] = assessment.get('archetype', 'unknown')

                # --------------- Target feature - y -------------------
                # If users who took chakra quiz, did they book appointment?
                # 1 - Yes or 0 - No
                features['converted'] = self.check_conversion(
                    features['email'],
                    features['assessment_date'],
                    appointments_df
                )

                # Add this processed assessment to the dataset
                dataset.append(features)


            except Exception as e:
                # print(f"Error processing assessment {e}")
                continue

        # Step 5: Convert list of dictionaries to pandas df
        df = pd.DataFrame(dataset)

        # Confirm some statistics
        # print(f"\nDataset created with {len(df)} records")
        # print(f"Conversion rate: {df['converted'].mean():.2%}")
        # print(f"Conversions: {df['converted'].sum()} out of {len(df)}")

        return df
    
    # Save dataset to CSV file
    def save_dataset(self, df, filename='chakra_conversion_dataset.csv'):
        # Get the full path to save the file (should be in the same directory)
        output_path = os.path.join(os.path.dirname(__file__), filename)

        # Save to CSV
        df.to_csv(output_path, index=False)

        # Confirm the path of saved dataset
        # print(f"\nDataset saved to {output_path}")

        return output_path
    
    # Close MongoDB connection
    def close(self):
        self.client.close()


# ========================== Main function =================================
# - Create a DataExtractor object
# - Build the dataset
# - Show statistics
# - Save to CSV
# - Close db connection
def main():
    try:
        # Step 1: Initialize extractor - connect to MongoDB
        extractor = DataExtractor()

        # Step 2: Create the full dataset
        df = extractor.create_dataset()

        # Step 3: Display stats about dataset
        # print(f"\nTotal records: {len(df)}")
        # print(f"\nTarget distribution: {df['converted'].value_counts()}")
        # print(f"\nConversion rate: {df['converted'].mean():.2%}")

        # Step 4: Save dataset to CSV
        extractor.save_dataset(df)

        # Step 5: Display the fist 5 rows 
        # print(f"First 5 rows of dataset\n")
        # print(df.head())

        # Step 6: Close MongoDB connection
        extractor.close

    except Exception as e:
        # print(f"ERROR: {e}")
        # Show full error trace for easily debugging
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

