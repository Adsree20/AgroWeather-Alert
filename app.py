
import os, sqlite3
from pathlib import Path
from datetime import datetime, timezone

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
DB_PATH = BASE_DIR / "agriweather.db"

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")}})

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# Academic prototype thresholds only. Validate locally before real-world use.
HEAVY_RAIN_MM = 30
EXTREME_HEAT_C = 38
DRY_RAIN_MM = 1
DRY_HEAT_C = 32

CROP_ADVICE = {
    "Rice": {
        "sowing": "Check seedbed drainage after rain and follow the locally recommended water level.",
        "vegetative": "Inspect field bunds and drainage channels. Monitor water depth.",
        "flowering": "Avoid sudden water stress and monitor field conditions closely.",
        "maturity": "Plan harvest and drying arrangements around forecast rainfall."
    },
    "Maize": {
        "sowing": "Avoid sowing into saturated soil; check field moisture first.",
        "vegetative": "Check drainage after heavy rain and inspect for lodging.",
        "flowering": "Monitor moisture stress during flowering and follow local irrigation guidance.",
        "maturity": "Plan harvest and safe drying if rain is forecast."
    },
    "Wheat": {
        "sowing": "Avoid waterlogged soil and check the locally recommended sowing window.",
        "vegetative": "Inspect drainage and crop condition after heavy rain.",
        "flowering": "Monitor heat and moisture stress; seek local agronomy guidance.",
        "maturity": "Arrange harvest and storage plans before forecast rain."
    },
    "Cotton": {
        "sowing": "Check soil moisture and avoid sowing in saturated fields.",
        "vegetative": "Ensure drainage and inspect plants after heavy rain.",
        "flowering": "Monitor moisture stress and follow local irrigation recommendations.",
        "maturity": "Keep picking and storage plans flexible during rainy periods."
    },
    "Groundnut": {
        "sowing": "Use suitable soil moisture and avoid sowing just before intense rain.",
        "vegetative": "Prevent waterlogging by keeping drainage channels clear.",
        "flowering": "Monitor soil moisture and follow local irrigation guidance.",
        "maturity": "Plan lifting around the forecast to avoid prolonged wet soil."
    },
    "Tomato": {
        "sowing": "Protect nursery seedlings from intense rain and heat.",
        "vegetative": "Improve drainage and inspect for disease after prolonged wet weather.",
        "flowering": "Heat may affect flower set; follow local advice on irrigation and shade.",
        "maturity": "Harvest ripe fruits before severe weather where practical and keep produce dry."
    }
}

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location TEXT NOT NULL, crop TEXT NOT NULL, stage TEXT NOT NULL,
                alert_type TEXT NOT NULL, severity TEXT NOT NULL,
                message TEXT NOT NULL, created_at TEXT NOT NULL
            )
        """)
        conn.commit()

def save_alerts(location, crop, stage, alerts):
    with sqlite3.connect(DB_PATH) as conn:
        for alert in alerts:
            conn.execute(
                """INSERT INTO alerts(location,crop,stage,alert_type,severity,message,created_at)
                   VALUES(?,?,?,?,?,?,?)""",
                (location, crop, stage, alert["type"], alert["severity"],
                 alert["message_en"], datetime.now(timezone.utc).isoformat())
            )
        conn.commit()

def generate_alerts(daily):
    alerts = []
    dates = daily.get("time", [])
    rain = daily.get("precipitation_sum", [])
    max_temp = daily.get("temperature_2m_max", [])
    rain_prob = daily.get("precipitation_probability_max", [])
    for i, date in enumerate(dates):
        mm = rain[i] if i < len(rain) and rain[i] is not None else 0
        temp = max_temp[i] if i < len(max_temp) and max_temp[i] is not None else 0
        chance = rain_prob[i] if i < len(rain_prob) and rain_prob[i] is not None else 0
        if mm >= HEAVY_RAIN_MM:
            alerts.append({"date": date, "type": "heavy_rain", "severity": "high",
                           "value": round(mm, 1), "rain_mm": round(mm, 1), "temperature_c": round(temp, 1),
                           "rain_probability": chance})
        if temp >= EXTREME_HEAT_C:
            alerts.append({"date": date, "type": "extreme_heat", "severity": "high",
                           "value": round(temp, 1), "rain_mm": round(mm, 1), "temperature_c": round(temp, 1),
                           "rain_probability": chance})
        if mm < DRY_RAIN_MM and temp >= DRY_HEAT_C:
            alerts.append({"date": date, "type": "dry_period", "severity": "medium",
                           "value": round(temp, 1), "rain_mm": round(mm, 1), "temperature_c": round(temp, 1),
                           "rain_probability": chance})
    return alerts

def get_gemini_client():
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        return None
    return genai.Client(api_key=key)

@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "gemini_configured": bool(os.getenv("GEMINI_API_KEY"))})

@app.get("/api/weather")
def weather():
    place = request.args.get("location", "").strip()
    crop = request.args.get("crop", "Rice")
    stage = request.args.get("stage", "vegetative")
    if len(place) < 2:
        return jsonify({"error": "Enter a town, city or village name."}), 400
    try:
        geo = requests.get(GEOCODING_URL,
            params={"name": place, "count": 1, "language": "en", "format": "json"}, timeout=12)
        geo.raise_for_status()
        results = geo.json().get("results", [])
        if not results:
            return jsonify({"error": "Location not found. Try a nearby town or city."}), 404
        loc = results[0]
        forecast = requests.get(FORECAST_URL, params={
            "latitude": loc["latitude"], "longitude": loc["longitude"],
            "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
            "timezone": "auto", "forecast_days": 7
        }, timeout=15)
        forecast.raise_for_status()
        data = forecast.json()
        alerts = generate_alerts(data.get("daily", {}))
        location_name = ", ".join(x for x in [loc.get("name"), loc.get("admin1"), loc.get("country")] if x)
        save_alerts(location_name, crop, stage, alerts)
        return jsonify({
            "location": location_name, "latitude": loc["latitude"], "longitude": loc["longitude"],
            "timezone": data.get("timezone"), "current": data.get("current", {}),
            "daily": data.get("daily", {}), "alerts": alerts,
            "crop_advice": CROP_ADVICE.get(crop, {}).get(stage, ""),
            "crop": crop, "stage": stage, "source": "Open-Meteo"
        })
    except requests.RequestException:
        return jsonify({"error": "Weather service unavailable. Check internet and try again."}), 502

@app.post("/api/ai-advice")
def ai_advice():
    body = request.get_json(silent=True) or {}
    weather_data = body.get("weather")
    language = body.get("language", "English")
    if not weather_data:
        return jsonify({"error": "Weather information is required before requesting AI advice."}), 400
    client = get_gemini_client()
    if client is None:
        return jsonify({"error": "Gemini API key is not configured. Add GEMINI_API_KEY to backend/.env."}), 503

    # Send only the relevant forecast summary to Gemini; do not let model output create warnings.
    prompt = f"""
You are an agricultural information assistant for a student prototype.
Write a concise, practical advisory in {language}.
Use only the weather facts and crop details supplied below.
Crop: {weather_data.get('crop')}
Growth stage: {weather_data.get('stage')}
Location: {weather_data.get('location')}
Current conditions: {weather_data.get('current')}
Seven-day forecast: {weather_data.get('daily')}
Rule-based alerts: {weather_data.get('alerts')}
Existing general crop guidance: {weather_data.get('crop_advice')}
Give:
1. A short summary of the weather risk.
2. Three practical precautionary actions relevant to the crop stage.
3. A brief reminder to follow official local weather bulletins and agricultural extension advice.
Do not invent weather facts, exact irrigation quantities, pesticide doses, or guaranteed outcomes.
If there is no alert, say no configured extreme-weather threshold was triggered in this forecast.
Keep the answer under 180 words. Use clear, farmer-friendly language.
"""
    try:
        response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        answer = (response.text or "").strip()
        if not answer:
            return jsonify({"error": "Gemini returned an empty response. Try again."}), 502
        return jsonify({"advice": answer, "model": GEMINI_MODEL})
    except Exception as exc:
        app.logger.exception("Gemini request failed")
        return jsonify({"error": "Gemini request failed. Check the API key, model access and network connection."}), 502

@app.get("/api/history")
def history():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT location,crop,stage,alert_type,severity,message,created_at FROM alerts ORDER BY id DESC LIMIT 30"
        ).fetchall()
    return jsonify([dict(row) for row in rows])

if __name__ == "__main__":
    init_db()
    app.run(host="127.0.0.1", port=5000, debug=True)
