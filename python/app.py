from flask import Flask, jsonify
from predict_trend import get_prediction

app = Flask(__name__)

@app.get("/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/api/predict_trend")
def predict_route():
    result = get_prediction()
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)
