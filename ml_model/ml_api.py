# Create Flash REST API for conversion prediction
# This creates a web API that the Node.js app can call to get real-time
# conversion predictions
# Because it a REST API, apps talk to each other over HTTP

# Endpoints
# - Get     /health         => Check if API is running
# - POST    /predict        => Get prediction for 1 assessment
# - POST    /predict/batch  => Get prediction for multiple assessments
# - GET     /model/info     => Get info about the loaded model

# ====================== Import libraries ===============================
# Flask: web framework for building APIs
from flask import Flask, request, jsonify
# CORS: allows Node.js to call our API
from flask_cors import CORS
# Our prediction service in predict_new.py
from predict_new import ConversionPredictorService
import os

# ===================== Create Flask app =================================
app = Flask(__name__)

# ===================== Configure CORS for Security =======================
# CORS (Cross-Origin Resource Sharing) controls which domains can access this API
# In development: Allow all origins for easy testing
# In production: Only allow requests from our deployed web app for security

if os.environ.get('NODE_ENV') == 'development':
    # Development mode - allow all origins
    CORS(app)
    print("CORS: Allowing all origins (development mode)")
else:
    # Production mode - only allow your specific web app URLs
    allowed_origins = [
        "https://graceful-living-web-application.onrender.com",  # Render URL
        "https://coachshante.com",  # Custom domain
        "https://www.coachshante.com"  # Custom domain with www
    ]
    CORS(app, origins=allowed_origins)
    print(f"CORS: Restricted to {len(allowed_origins)} allowed origins (production mode)")

try:
    predictor = ConversionPredictorService()
except Exception as e:
    print(f"ERROR loading model: {e}")
    predictor = None

# ================================= API ENDPOINTS =========================

# ----------- Health check endpoint ---------------------
# Check if API is running and model is loaded
# Our app should check if ML serice is up before prediction
@app.route('/health', methods=['GET'])
def health_check():
    # Check if model loaded successfully
    if predictor is None:
        # Return error response with 500 status code
        return jsonify({
            'status': 'error',
            'message': 'Model not loaded'
        }), 500
    # Model loaded fine
    return jsonify({
        'status': 'ok',
        'message': 'Prediction service is running'
    })

# -------------- Predict conversion probability - Main endpoint -------------
@app.route('/predict', methods=['POST'])
def predict_single():
    # Check if model is loaded
    if predictor is None:
        return jsonify({
            'error': "Model not loaded"
        }), 500
    
    try:
        # Get JSON data from request body
        assessment_data = request.json # parse JSON to Python dictionary automatically

        # Validate provided data
        if not assessment_data:
            # Return bad rquest - 400 if no data
            return jsonify({
                'error': 'No assessment data provided'
            }), 400
        
        # Make prediction using predictor service
        result = predictor.predict_conversion_probability(assessment_data)

        # Return success response with prediction
        return jsonify({
            'success': True,
            'prediction': result
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    if predictor is None:
        return jsonify({
            'eror': 'Model not loaded'
        }), 500
    
    try:
        assessments_list = request.json

        if not isinstance(assessments_list, list):
            return jsonify({
                'error': 'Request must be a JSON array of assessment'
            }), 400
        
        results = predictor.predict_batch(assessments_list)

        return jsonify({
            'success': True,
            'count': len(results),
            'predictions': results
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
# ===================== Get model info endpoint ==========================
@app.route('/model/info', methods=['GET'])
def model_info():
    if predictor is None:
        return jsonify({
            'error': 'Model not loaded'
        }), 500
    
    # Get training samples count if available
    training_samples = getattr(predictor.model, 'n_samples_', 'Unknown')
    if training_samples == 'Unknown':
        # Try to get from model's training history
        training_samples = getattr(predictor.model, 'n_training_samples_', 'N/A')
    
    return jsonify({
        'model_type': str(type(predictor.model).__name__),
        'num_features': len(predictor.feature_names),
        'features': predictor.feature_names[:10],
        'training_samples': training_samples
    })

# =================== Start the API server =============================
if __name__ == '__main__':
    # Get port from environment variable (Render sets this) or default to 5001
    port = int(os.environ.get('PORT', 5001))
    
    # Print info about endpoints
    print("\n" + "="*60)
    print("CONVERSION PREDICTION API")
    print("="*60)
    print("\nEndpoints:")
    print("  GET  /health          - Health check")
    print("  POST /predict         - Single prediction")
    print("  POST /predict/batch   - Batch predictions")
    print("  GET  /model/info      - Model information")
    print(f"\nStarting server on http://0.0.0.0:{port}")
    print("="*60 + "\n")

    app.run(
        host='0.0.0.0',     # Listen to all network interfaces
        port=port,          # Use environment PORT or default 5001
        debug=False         # IMPORTANT: set to True during dev, set to False in Prod
    )



