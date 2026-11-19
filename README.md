
# AgriWeather Alert – React + Vite + Flask + SQLite + Gemini

Student prototype for the project **Extreme Weather Alert for Farmers**.

## Architecture
- React + Vite: farmer dashboard and language selector.
- Flask: REST API, weather processing and Gemini integration.
- SQLite: stores alerts generated from live forecast data.
- Open-Meteo: location search and weather forecasts.
- Google Gemini API: creates a farmer-friendly advisory from supplied forecast/crop data.

## Prerequisites
- Python 3.10+
- Node.js 20+ (recommended current LTS)
- VS Code
- Internet connection
- Gemini API key from Google AI Studio

## 1. Configure Gemini
1. Open https://aistudio.google.com/app/apikey and create an API key.
2. In the `backend` folder, copy `.env.example` to `.env`.
3. Put your key after `GEMINI_API_KEY=`.
4. Do not put the key in React code or commit `.env` to Git.

Example:
```env
GEMINI_API_KEY=your_real_key_here
GEMINI_MODEL=gemini-2.5-flash
FRONTEND_ORIGIN=http://localhost:5173
```

## 2. Start the Flask backend (Terminal 1)
Open VS Code terminal and run:
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```
If PowerShell blocks activation:
```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```
Backend runs at `http://127.0.0.1:5000`.

## 3. Start React + Vite frontend (Terminal 2)
Open a second VS Code terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open the Vite URL printed in the terminal, normally `http://localhost:5173`.

## macOS/Linux
Backend:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```
Frontend in a second terminal:
```bash
cd frontend
npm install
npm run dev
```

## How to use
1. Enter a city/town/village (e.g. Bengaluru).
2. Select crop and crop growth stage.
3. Click Get weather & alerts.
4. Review current weather, seven-day chart, rule-based alerts and crop-stage guidance.
5. Choose English, Kannada or Telugu.
6. Click Ask Gemini for farming advice. The backend sends the weather summary and crop context to Gemini and displays its answer.
7. Recent alerts generated from live forecasts are stored in SQLite.

## Prototype Model phases
1. Requirement gathering: farmers need timely local weather and crop-stage information.
2. Quick design: design the dashboard, form, forecast and alerts.
3. Build initial prototype: implement React screens and sample/demo design.
4. User evaluation: demonstrate to intended users/project guide and collect feedback.
5. Refinement: improve layout, language, accessibility and advice.
6. Final product development: connect Open-Meteo, Flask, SQLite and Gemini.
7. Testing/deployment: test valid/invalid locations, API failures, alert conditions, all languages and AI response.

## API responsibilities
- Open-Meteo is the source of current conditions and forecast data.
- Gemini does not measure or provide local live weather. It interprets the supplied weather and crop information to draft an advisory.
- The backend makes the Gemini request so the API key is not exposed in the browser.

## Prototype limitations and safety
- The 30 mm/day heavy-rain, 38°C heat, and hot/dry rules are illustrative academic thresholds, not official IMD warnings or universal crop-safety limits.
- Gemini advice is generated text and may be inaccurate. It must not replace official weather bulletins or local agricultural extension advice.
- The project does not currently send SMS, WhatsApp or push notifications.
- Do not rely on the prototype for emergency decisions. Validate thresholds and agronomic advice with local experts before any real-world use.
