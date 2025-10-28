#!/usr/bin/env python3
"""
Test script for ML API
This script tests if the ML API is running and working correctly
"""

import requests
import json
import sys

API_URL = "http://localhost:5001"

def print_header(text):
    print("\n" + "="*60)
    print(text)
    print("="*60)

def test_health():
    """Test the /health endpoint"""
    print_header("Testing /health endpoint")
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200 and response.json().get('status') == 'ok':
            print("✅ Health check PASSED")
            return True
        else:
            print("❌ Health check FAILED")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to ML API")
        print("   Make sure the ML API is running on http://localhost:5001")
        print("   Run: python3 ml_api.py")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_model_info():
    """Test the /model/info endpoint"""
    print_header("Testing /model/info endpoint")
    try:
        response = requests.get(f"{API_URL}/model/info", timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Model Info:")
            print(f"   - Model Type: {data.get('model_type')}")
            print(f"   - Features: {data.get('num_features')}")
            print(f"   - Training Samples: {data.get('training_samples')}")
            return True
        else:
            print("❌ Model info FAILED")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_single_prediction():
    """Test the /predict endpoint with sample data"""
    print_header("Testing /predict endpoint (single prediction)")
    
    # Sample assessment data
    sample_data = {
        "email": "test@example.com",
        "ageBracket": "30-40",
        "healthcareWorker": "No",
        "healthcareYears": "",
        "challenges": ["stress", "anxiety"],
        "familiarWith": ["meditation"],
        "goals": "Find balance",
        "focusChakra": "heartChakra",
        "archetype": "healer",
        "scoredChakras": {
            "rootChakra": {
                "q1": {"score": 3},
                "q2": {"score": 4}
            }
        },
        "scoredLifeQuadrants": {
            "healthWellness": {
                "q1": {"score": 3}
            }
        }
    }
    
    try:
        response = requests.post(
            f"{API_URL}/predict",
            json=sample_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200 and response.json().get('success'):
            result = response.json()['prediction']
            print(f"\n✅ Prediction Result:")
            print(f"   - Will Convert: {result.get('will_convert')}")
            print(f"   - Probability: {result.get('conversion_probability'):.2%}")
            print(f"   - Risk Level: {result.get('risk_level')}")
            return True
        else:
            print("❌ Prediction FAILED")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_batch_prediction():
    """Test the /predict/batch endpoint"""
    print_header("Testing /predict/batch endpoint")
    
    # Sample batch data (2 assessments)
    sample_batch = [
        {
            "email": "user1@example.com",
            "ageBracket": "30-40",
            "healthcareWorker": "Yes",
            "healthcareYears": "4-7 years",
            "challenges": ["stress"],
            "familiarWith": ["meditation", "yoga"],
            "goals": "Find peace",
            "focusChakra": "heartChakra",
            "archetype": "healer",
            "scoredChakras": {},
            "scoredLifeQuadrants": {}
        },
        {
            "email": "user2@example.com",
            "ageBracket": "20-30",
            "healthcareWorker": "No",
            "healthcareYears": "",
            "challenges": ["anxiety", "depression"],
            "familiarWith": ["reiki"],
            "goals": "Reduce stress",
            "focusChakra": "rootChakra",
            "archetype": "warrior",
            "scoredChakras": {},
            "scoredLifeQuadrants": {}
        }
    ]
    
    try:
        response = requests.post(
            f"{API_URL}/predict/batch",
            json=sample_batch,
            headers={'Content-Type': 'application/json'},
            timeout=15
        )
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200 and response.json().get('success'):
            data = response.json()
            print(f"✅ Batch prediction successful")
            print(f"   - Count: {data.get('count')}")
            
            if 'predictions' in data:
                print(f"\n   Predictions:")
                for i, pred in enumerate(data['predictions'], 1):
                    print(f"   {i}. {pred.get('email')}: {pred.get('conversion_probability'):.2%} - {pred.get('risk_level')}")
            return True
        else:
            print(f"❌ Batch prediction FAILED")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def main():
    print("\n" + "🤖 ML API Test Suite".center(60))
    print("="*60)
    
    results = []
    
    # Run all tests
    results.append(("Health Check", test_health()))
    
    if not results[0][1]:
        print("\n❌ ML API is not running. Please start it first:")
        print("   cd ml_model")
        print("   python3 ml_api.py")
        sys.exit(1)
    
    results.append(("Model Info", test_model_info()))
    results.append(("Single Prediction", test_single_prediction()))
    results.append(("Batch Prediction", test_batch_prediction()))
    
    # Summary
    print_header("Test Summary")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:.<40} {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! ML API is working correctly.")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()

