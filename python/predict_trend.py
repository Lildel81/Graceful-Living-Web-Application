import os, json, warnings 
from pymongo import MongoClient
import pandas as pd
from dotenv import load_dotenv
from sklearn.linear_model import LinearRegression
import numpy as np

warnings.filterwarnings("ignore")

# 1) connect to Mongo using root .env
load_dotenv(dotenv_path="../.env")
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI missing. Put it in .env")

client = MongoClient(MONGO_URI)

db = client.get_database()
collection = db["chakraassessments"]

# 2) fetch minimal fields
docs = list(collection.find(
    {},
    {"createdAt": 1, "focusChakra": 1, "results": 1}
))

if not docs:
    print(json.dumps({"ok": True, "message": "No data yet", "forecast_counts": {}, "predicted_next_month": None}))
    raise SystemExit

df = pd.DataFrame(docs)
df["createdAt"] = pd.to_datetime(df["createdAt"], errors="coerce")
df = df.dropna(subset=["createdAt"])

# 3) ensure we have a 'closed' chakra per row
# prefer provided focusChakra; fallback: choose min-total from results.*
def infer_focus(row):
    if isinstance(row.get("focusChakra"), str) and len(row["focusChakra"]) > 0:
        return row["focusChakra"]

    res = row.get("results") or {}
    # results structure: { rootChakra: {total, average}, ... }
    # build a {chakraLabel: totalScore} dict; lower total => more closed
    totals = {}
    mapping = {
        "Root Chakra": "rootChakra",
        "Sacral Chakra": "sacralChakra",
        "Solar Plexus Chakra": "solarPlexusChakra",
        "Heart Chakra": "heartChakra",
        "Throat Chakra": "throatChakra",
        "Third Eye Chakra": "thirdEyeChakra",
        "Crown Chakra": "crownChakra",
    }
    for label, key in mapping.items():
        part = res.get(key) or {}
        t = part.get("total")
        if t is not None:
            try:
                totals[label] = float(t)
            except Exception:
                pass
    if totals:
        # closed = minimum total
        return min(totals, key=totals.get)
    return None

df["closedChakra"] = df.apply(infer_focus, axis=1)
df = df.dropna(subset=["closedChakra"])

# 4) group by month
df["month"] = df["createdAt"].dt.to_period("M")
trend = (
    df.groupby(["month", "closedChakra"])
      .size()
      .reset_index(name="count")
)

if trend.empty:
    print(json.dumps({"ok": True, "message": "Insufficient data after grouping", "forecast_counts": {}, "predicted_next_month": None}))
    raise SystemExit

# 5) pivot to get a time series per chakra
pivot = trend.pivot(index="month", columns="closedChakra", values="count").fillna(0)
pivot.index = pivot.index.to_timestamp()  # PeriodIndex -> TimestampIndex

# 6) tiny forecast: linear trend per chakra -> next month index = len(series)
forecast = {}
for chakra in pivot.columns:
    y = pivot[chakra].values
    if len(y) < 2:
        # not enough history; predict the last value
        forecast[chakra] = float(y[-1]) if len(y) == 1 else 0.0
        continue
    X = np.arange(len(y)).reshape(-1, 1)
    model = LinearRegression().fit(X, y)
    next_val = model.predict([[len(y)]])[0]
    forecast[chakra] = round(float(max(next_val, 0.0)), 2)  # no negatives

# 7) pick the predicted dominant (highest forecast count)
predicted = max(forecast, key=forecast.get) if forecast else None

# 8) respond as JSON for Express
out = {
    "ok": True,
    "message": "Forecast computed",
    "forecast_counts": forecast,
    "predicted_next_month": predicted,
    # for debugging/display
    "history_last_rows": (
        pivot.tail(6)
        .rename_axis("month")
        .reset_index()
        .assign(month=lambda df: df["month"].astype(str))
        .to_dict(orient="records")
    )
}
print(json.dumps(out, default=str))