# Train ML model for conversion prediction
# Take labeled dataset created by data_extraction.py and
# train ml models to predict who will book an appointment
# Workflow
# - Load data from csv file
# - Preprocess: scaling, encoding, dropping
# - Split train and test sets
# - Train: build multiple models and teach them patterns
# - Evaluate: Measure how well (accuracy) each model performs
# - Compare: pick the best performing model
# - Save: store the best model for prediction

# Import libraries
import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
# LogisticRegression: simple classification algorithm (linear boundary)
from sklearn.linear_model import LogisticRegression
# RandomForestClassifier: build many decision trees, average results
# GradientBoostingClassifier: build trees sequentially, each fixes mistaks
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

from sklearn.metrics import (
    classification_report,          # Show precission, recall, f1-score
    confusion_matrix,               # Show correct vs incorrect predictions
    roc_auc_score,                  # Measure ability of distinguish classes (0.5-1.0)
    roc_curve,                      # Data for plotting ROC curve
    accuracy_score                  # Simple percentage of correct predictions
)

import joblib                       # Save/load trained model to disk
import warnings                     # Control warning message

# Hide warnings to keep output clean
warnings.filterwarnings('ignore')

# =================================== Conversion predictor class ====================================
# Contain all logic for training and evaluating ml models

class ConversionPredictor:
    def __init__(self, dataset_path='chakra_conversion_dataset.csv'):
        self.dataset_path = dataset_path

        # The raw dataframe from csv
        self.df = None

        # 4 pieces of data after splitting
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None

        # StandardScaler for feature scaling
        self.scaler = StandardScaler()

        # The best model from the 3 created
        self.best_model = None

        # List of feature names
        self.feature_names = None

    # ============== Data loading ==================
    def load_data(self):
        self.df = pd.read_csv(self.dataset_path)

        print(f"\nIn train_model.py\n")
        # Confirm the data loaded
        print(f"Loaded {len(self.df)} records")

        # Confirm conversion rate
        print(f"Conversion rate: {self.df['converted'].mean():.2%}\n")

        return self.df
    
    # =========== Data preprocessing ================
    # - Remove non-feature cols
    # - OHE for categorical cols
    # - Handle missing vals
    # - Split data
    # - Scale features
    def preprocess_data(self):

        # Step 1: Remove non-feature cols
        df_features = self.df.drop(['email', 'assessment_date', 'converted'], axis=1, errors='ignore')
        
        # Step 2: Handle categorical cols
        catagorical_cols = df_features.select_dtypes(include=['object']).columns
        # Confirm
        print(f"Categorical cols: {list(catagorical_cols)}")

        # Using dummies for OHE
        df_encoded = pd.get_dummies(df_features, columns=catagorical_cols, drop_first=True)
        print(f"\n Categorical cols: {df_encoded}")

        # Step 3: Handle missing values
        df_encoded = df_encoded.fillna(0)

        # Step 4: Create features X and target y
        X = df_encoded
        y = pd.Series(self.df['converted'])
        
        # Store feature names for later use in prediction
        self.feature_names = list(X.columns)

        # Step 5: Split data
        # Splite 80% train and 20% test
        # stratify=y: keep same coversion rate in train and test sets (class ballance)

        # Check if we can use stratified split
        unique_values = y.value_counts()
        can_stratify = len(unique_values) > 1 and all(unique_values >=2)

        if can_stratify:
            print("Use stratify split to maintain class ballance")
            self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(X, y, test_size=0.2, stratify=y)
        else:
            print("Use regular split")
            self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(X, y, test_size=0.2)
        
        # Confirm the splitted sets
        print(f"Training set: {len(self.X_train)} samples")
        print(f"Training conversion rate: {self.y_train.mean():.2%}")
        print(f"Test set: {len(self.X_test)} samples")
        print(f"Test conversion rate: {self.y_test.mean():.2%}")

        # Step 6: Scale features
        self.X_train = self.scaler.fit_transform(self.X_train)      # fit_transform on training
        self.X_test = self.scaler.transform(self.X_test)            # transform on test

        return self.X_train, self.X_test, self.y_train, self.y_test
    
    # =================== Model training methods ==================================

    def train_logistic_regression(self):
        # Confirm the model
        print(f"\nTraining LogisticRegression\n")

        # Check if we have at least 2 classes (0 and 1)
        unique_classes = set(self.y_train)
        if len(unique_classes) < 2:
            print(f"WARNING: Only {len(unique_classes)} class(es) in training data: {unique_classes}")
            print(f"\nNeed at least 1 assessment that lead to an appointment\n") 

            return None, None
        
        # Create the model with config
        model = LogisticRegression(max_iter=1000, class_weight='balanced')

        # Train model
        model.fit(self.X_train, self.y_train)

        # Evaluate the model
        y_pred = model.predict(self.X_test)

        y_pred_proba = model.predict_proba(self.X_test)[:, 1]

        # Classification report
        print(classification_report(self.y_test, y_pred))

        # Cross-validation
        cv_scores = cross_val_score(model, self.X_train, self.y_train, cv=5, scoring='roc_auc')
        print(f"Cross validation ROC-AUC: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})\n")

        return model, y_pred_proba
    
    def train_randon_forest(self):
        print(f"\nTraining RandomForest\n")

        # Check if we have at least 2 classes
        unique_classes = set(self.y_train)
        if len(unique_classes) < 2:
            print(f"WARNING: Only {len(unique_classes)} class(es) in training data: {unique_classes}")
            print(f"\nNeed at least 1 assessment that lead to an appointment\n") 

            return None, None
        
        model = RandomForestClassifier(
            n_estimators=100,           # Build 100 decision trees
            class_weight='balanced',
            max_depth=10,               # Limit tree deepth to prevent overfitting
            min_samples_split=10        # Need at least 10 samples to split a node
        )

        model.fit(self.X_train, self.y_train)

        y_pred = model.predict(self.X_test)
        y_pred_proba = model.predict_proba(self.X_test)[:, 1]

        # Classification report
        print(classification_report(self.y_test, y_pred))
         # Cross-validation
        cv_scores = cross_val_score(model, self.X_train, self.y_train, cv=5, scoring='roc_auc')
        print(f"Cross validation ROC-AUC: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})\n")

        return model, y_pred_proba
    
    def train_gradient_boosting(self):
        print(f"\nTraining Gradient Boosting\n")
        # Check if we have at least 2 classes
        unique_classes = set(self.y_train)
        if len(unique_classes) < 2:
            print(f"WARNING: Only {len(unique_classes)} class(es) in training data: {unique_classes}")
            print(f"\nNeed at least 1 assessment that lead to an appointment\n") 

        model = GradientBoostingClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1
        )
        model.fit(self.X_train, self.y_train)

        y_pred = model.predict(self.X_test)
        y_pred_proba = model.predict_proba(self.X_test)[:, 1]

        # Classification report
        print(classification_report(self.y_test, y_pred))
         # Cross-validation
        cv_scores = cross_val_score(model, self.X_train, self.y_train, cv=5, scoring='roc_auc')
        print(f"Cross validation ROC-AUC: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})\n")

        return model, y_pred_proba

    def save_model(self, model, model_name='best_model'):
        model_path = os.path.join(os.path.dirname(__file__), f'{model_name}.pkl')
        scaler_path = os.path.join(os.path.dirname(__file__), 'scaler.pkl')
        features_path = os.path.join(os.path.dirname(__file__), 'features_names.pkl')

        joblib.dump(model, model_path)
        joblib.dump(self.scaler, scaler_path)
        joblib.dump(self.feature_names, features_path)

    def train_all_models(self):
        print(f"\n" + "="*60)
        print("Training conversion prediction model")
        print("="*60 + f"\n")

        # Train model
        lr_model, lr_proba = self.train_logistic_regression()
        rf_model, rf_proba = self.train_randon_forest()
        gb_model, gb_proba = self.train_gradient_boosting()

        # Store model
        models_dict = {}
        if lr_model is not None:
            models_dict['Logistic Regression'] = (lr_model, lr_proba)
        if rf_model is not None:
            models_dict['Random Forest'] = (rf_model, rf_proba)
        if gb_model is not None:
            models_dict['Gradient Boosting'] = (gb_model, gb_proba)

        # Check if we have any trained model
        if len(models_dict) == 0:
            print("ERROR: No models trained")
            print(f"\nNeed to create 2 classes in the dataset")
        
        # Compare models
        best_auc = 0
        best_model_name = None
        best_model = None

        for name, (model, y_pred_proba) in models_dict.items():
            # Skip None models
            if model is None or y_pred_proba is None:
                continue
            try:
                auc = roc_auc_score(self.y_test, y_pred_proba)
                acc = accuracy_score(self.y_test, model.predict(self.X_test))
                print(f"{name}:")
                print(f"  Accuracy: {acc:.4f}")
                print(f"  ROC-AUC: {auc:.4f}\n")

                if auc > best_auc:
                    best_auc = auc
                    best_model_name = name
                    best_model = model
            except Exception as e:
                print(f"Error Comparing {name}: {e}\n")
        
        if best_model is None:
            print(f"No valide models to compare\n")
        else:
            print(f"Best Model: {best_model_name} (ROC-AUC: {best_auc:.4f})\n")
        
        self.best_model = best_model

        # Save best model
        self.save_model(best_model, 'best_conversion_model')

        return best_model
    

    
def main():
    try:
        predictor = ConversionPredictor()

        predictor.load_data()

        predictor.preprocess_data()

        best_model = predictor.train_all_models()

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
    




