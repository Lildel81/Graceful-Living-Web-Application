#!/bin/bash
# Quick curl tests for ML API endpoints

API_URL="http://localhost:5001"

echo "=========================================="
echo "Testing ML API Endpoints with cURL"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "1. Testing GET /health"
echo "----------------------------------------"
curl -s "$API_URL/health" | python3 -m json.tool
echo ""
echo ""

# Test 2: Model Info
echo "2. Testing GET /model/info"
echo "----------------------------------------"
curl -s "$API_URL/model/info" | python3 -m json.tool
echo ""
echo ""

# Test 3: Single Prediction
echo "3. Testing POST /predict"
echo "----------------------------------------"
curl -s -X POST "$API_URL/predict" \
  -H "Content-Type: application/json" \
  -d '{
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
      },
      "heartChakra": {
        "q1": {"score": 5},
        "q2": {"score": 4}
      }
    },
    "scoredLifeQuadrants": {
      "healthWellness": {
        "q1": {"score": 3}
      }
    }
  }' | python3 -m json.tool
echo ""
echo ""

echo "=========================================="
echo "Tests Complete!"
echo "=========================================="

