
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { Sprout, CloudSun, MapPin, Droplets, Wind, Thermometer, Languages, Sparkles, AlertTriangle, RefreshCw } from "lucide-react";

const API = "http://127.0.0.1:5000";
const translations = {
  en: {
    tagline:"SMART WEATHER SUPPORT FOR FARMERS",title:"Make weather-ready farming decisions.",
    intro:"Local forecasts and crop-stage alerts, in one simple dashboard.",farm:"Your farm details",
    location:"Location",crop:"Crop",stage:"Crop growth stage",get:"Get weather & alerts",
    current:"Current weather",temp:"Temperature",humidity:"Humidity",rain:"Precipitation",wind:"Wind speed",
    forecast:"7-day forecast",alerts:"Weather alerts",advice:"Crop-stage guidance",
    ai:"Ask Gemini for farming advice",aiDesc:"AI-generated explanation based on the forecast and your crop details.",
    history:"Recent saved alerts",loading:"Loading weather…",noAlerts:"No configured extreme-weather threshold was triggered in this forecast.",
    noHistory:"No saved alerts yet.",source:"Weather source: Open-Meteo",disclaimer:"Educational prototype only. Verify important decisions with official weather bulletins and local agricultural experts.",
    rainAlert:"Heavy rain alert",heatAlert:"Extreme heat alert",dryAlert:"Hot and dry period",high:"HIGH",medium:"MEDIUM",
    demo:"AI crop advisory",ask:"Generate AI advisory",asking:"Asking Gemini…",selectLocation:"Enter a town, city or village",
    sowing:"Sowing",vegetative:"Vegetative",flowering:"Flowering",maturity:"Maturity",
    error:"Could not load weather. Check the Flask server and internet connection."
  },
  kn: {
    tagline:"ರೈತರಿಗಾಗಿ ಸ್ಮಾರ್ಟ್ ಹವಾಮಾನ ಸಹಾಯ",title:"ಹವಾಮಾನಕ್ಕೆ ತಕ್ಕ ಕೃಷಿ ನಿರ್ಧಾರಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ.",
    intro:"ಸ್ಥಳೀಯ ಮುನ್ಸೂಚನೆ ಮತ್ತು ಬೆಳೆ ಹಂತದ ಎಚ್ಚರಿಕೆಗಳು ಒಂದೇ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ.",farm:"ನಿಮ್ಮ ಕೃಷಿ ವಿವರಗಳು",
    location:"ಸ್ಥಳ",crop:"ಬೆಳೆ",stage:"ಬೆಳೆಯ ಬೆಳವಣಿಗೆಯ ಹಂತ",get:"ಹವಾಮಾನ ಮತ್ತು ಎಚ್ಚರಿಕೆ ಪಡೆಯಿರಿ",
    current:"ಪ್ರಸ್ತುತ ಹವಾಮಾನ",temp:"ತಾಪಮಾನ",humidity:"ಆರ್ದ್ರತೆ",rain:"ಮಳೆ",wind:"ಗಾಳಿಯ ವೇಗ",
    forecast:"7 ದಿನಗಳ ಮುನ್ಸೂಚನೆ",alerts:"ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳು",advice:"ಬೆಳೆಯ ಹಂತದ ಸಲಹೆ",
    ai:"ಕೃಷಿ ಸಲಹೆಗಾಗಿ Gemini ಅನ್ನು ಕೇಳಿ",aiDesc:"ಮುನ್ಸೂಚನೆ ಮತ್ತು ಬೆಳೆ ವಿವರಗಳ ಆಧಾರದ ಮೇಲೆ AI ಸಲಹೆ.",
    history:"ಇತ್ತೀಚಿನ ಉಳಿಸಿದ ಎಚ್ಚರಿಕೆಗಳು",loading:"ಹವಾಮಾನ ಮಾಹಿತಿ ಪಡೆಯಲಾಗುತ್ತಿದೆ…",noAlerts:"ಈ ಮುನ್ಸೂಚನೆಯಲ್ಲಿ ನಿಗದಿತ ತೀವ್ರ ಹವಾಮಾನ ಮಿತಿ ತಲುಪಿಲ್ಲ.",
    noHistory:"ಇನ್ನೂ ಯಾವುದೇ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ.",source:"ಹವಾಮಾನ ಮೂಲ: Open-Meteo",disclaimer:"ಇದು ಶೈಕ್ಷಣಿಕ ಮಾದರಿ ಮಾತ್ರ. ಅಧಿಕೃತ ಹವಾಮಾನ ಮಾಹಿತಿ ಮತ್ತು ಕೃಷಿ ತಜ್ಞರ ಸಲಹೆ ಪರಿಶೀಲಿಸಿ.",
    rainAlert:"ಭಾರಿ ಮಳೆ ಎಚ್ಚರಿಕೆ",heatAlert:"ತೀವ್ರ ಬಿಸಿಲಿನ ಎಚ್ಚರಿಕೆ",dryAlert:"ಬಿಸಿ ಮತ್ತು ಒಣ ಅವಧಿ",high:"ಹೆಚ್ಚಿನ",medium:"ಮಧ್ಯಮ",
    demo:"AI ಬೆಳೆ ಸಲಹೆ",ask:"AI ಸಲಹೆ ಪಡೆಯಿರಿ",asking:"Gemini ಸಲಹೆ ನೀಡುತ್ತಿದೆ…",selectLocation:"ಪಟ್ಟಣ ಅಥವಾ ಗ್ರಾಮದ ಹೆಸರು ನಮೂದಿಸಿ",
    sowing:"ಬಿತ್ತನೆ",vegetative:"ಬೆಳವಣಿಗೆ",flowering:"ಹೂ ಬಿಡುವ ಹಂತ",maturity:"ಪಕ್ವತೆ",
    error:"ಹವಾಮಾನ ಪಡೆಯಲಾಗಲಿಲ್ಲ. Flask ಸರ್ವರ್ ಮತ್ತು ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ."
  },
  te: {
    tagline:"రైతుల కోసం స్మార్ట్ వాతావరణ సహాయం",title:"వాతావరణానికి అనుగుణంగా వ్యవసాయ నిర్ణయాలు తీసుకోండి.",
    intro:"స్థానిక సూచనలు మరియు పంట దశ హెచ్చరికలు ఒకే డాష్‌బోర్డ్‌లో.",farm:"మీ వ్యవసాయ వివరాలు",
    location:"ప్రాంతం",crop:"పంట",stage:"పంట పెరుగుదల దశ",get:"వాతావరణం & హెచ్చరికలు పొందండి",
    current:"ప్రస్తుత వాతావరణం",temp:"ఉష్ణోగ్రత",humidity:"తేమ",rain:"వర్షపాతం",wind:"గాలి వేగం",
    forecast:"7 రోజుల సూచన",alerts:"వాతావరణ హెచ్చరికలు",advice:"పంట దశ సూచన",
    ai:"వ్యవసాయ సలహా కోసం Geminiని అడగండి",aiDesc:"వాతావరణ సూచన మరియు పంట వివరాల ఆధారంగా AI సలహా.",
    history:"ఇటీవల సేవ్ చేసిన హెచ్చరికలు",loading:"వాతావరణ సమాచారం పొందుతోంది…",noAlerts:"ఈ సూచనలో నిర్ణయించిన తీవ్ర వాతావరణ పరిమితి చేరలేదు.",
    noHistory:"ఇంకా హెచ్చరికలు సేవ్ కాలేదు.",source:"వాతావరణ మూలం: Open-Meteo",disclaimer:"ఇది విద్యా ప్రయోజనాల నమూనా మాత్రమే. అధికారిక వాతావరణ బులెటిన్లు మరియు వ్యవసాయ నిపుణుల సలహా తీసుకోండి.",
    rainAlert:"భారీ వర్ష హెచ్చరిక",heatAlert:"తీవ్ర వేడి హెచ్చరిక",dryAlert:"వేడి మరియు పొడి కాలం",high:"అధిక",medium:"మధ్యస్థ",
    demo:"AI పంట సలహా",ask:"AI సలహా రూపొందించండి",asking:"Gemini సలహా ఇస్తోంది…",selectLocation:"పట్టణం లేదా గ్రామం పేరు నమోదు చేయండి",
    sowing:"విత్తడం",vegetative:"వృద్ధి దశ",flowering:"పుష్పించే దశ",maturity:"పక్వ దశ",
    error:"వాతావరణం పొందలేకపోయాం. Flask సర్వర్ మరియు ఇంటర్నెట్ తనిఖీ చేయండి."
  }
};

const crops = ["Rice","Maize","Wheat","Cotton","Groundnut","Tomato"];
const alertTitle = {heavy_rain:"rainAlert",extreme_heat:"heatAlert",dry_period:"dryAlert"};
const dayLabel = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined,{weekday:"short",day:"numeric"});

export default function App() {
  const [lang,setLang] = useState("en");
  const [location,setLocation] = useState("Bengaluru");
  const [crop,setCrop] = useState("Rice");
  const [stage,setStage] = useState("vegetative");
  const [data,setData] = useState(null);
  const [history,setHistory] = useState([]);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [aiAdvice,setAiAdvice] = useState("");
  const [aiBusy,setAiBusy] = useState(false);
  const tr = translations[lang];

  async function loadHistory(){
    try { const r=await fetch(`${API}/api/history`); if(r.ok)setHistory(await r.json()); } catch {}
  }
  async function getWeather(e){
    e?.preventDefault(); setBusy(true);setError("");setAiAdvice("");
    try{
      const q=new URLSearchParams({location,crop,stage});
      const r=await fetch(`${API}/api/weather?${q}`);
      const j=await r.json(); if(!r.ok)throw new Error(j.error||tr.error);
      setData(j); await loadHistory();
    }catch(err){setError(err.message||tr.error);}
    finally{setBusy(false);}
  }
  async function askGemini(){
    if(!data)return;setAiBusy(true);setAiAdvice("");setError("");
    try{
      const language={en:"English",kn:"Kannada",te:"Telugu"}[lang];
      const r=await fetch(`${API}/api/ai-advice`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({weather:data,language})
      });
      const j=await r.json();if(!r.ok)throw new Error(j.error||"Gemini request failed.");
      setAiAdvice(j.advice);
    }catch(err){setError(err.message);}
    finally{setAiBusy(false);}
  }
  useEffect(()=>{loadHistory();},[]);
  const chartData=useMemo(()=>{
    if(!data?.daily?.time)return [];
    return data.daily.time.map((date,i)=>({
      day:dayLabel(date),
      max:data.daily.temperature_2m_max?.[i],
      min:data.daily.temperature_2m_min?.[i],
      rain:data.daily.precipitation_sum?.[i]
    }));
  },[data]);

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Sprout size={25}/></div><div><b>AgriWeather <span>Alert</span></b><small>{tr.tagline}</small></div></div>
      <label className="language"><Languages size={16}/><select value={lang} onChange={e=>setLang(e.target.value)}><option value="en">English</option><option value="kn">ಕನ್ನಡ</option><option value="te">తెలుగు</option></select></label>
    </header>

    <main className="main">
      <section className="hero">
        <div><span className="eyebrow">🌱 {tr.tagline}</span><h1>{tr.title}</h1><p>{tr.intro}</p></div>
        <div className="hero-art">🌾</div>
      </section>

      <section className="panel">
        <div className="section-title"><div><span className="number">01</span><h2>{tr.farm}</h2></div></div>
        <form className="farm-form" onSubmit={getWeather}>
          <label>{tr.location}<div className="input-wrap"><MapPin size={17}/><input value={location} onChange={e=>setLocation(e.target.value)} placeholder={tr.selectLocation} minLength="2" required/></div></label>
          <label>{tr.crop}<select value={crop} onChange={e=>setCrop(e.target.value)}>{crops.map(x=><option key={x}>{x}</option>)}</select></label>
          <label>{tr.stage}<select value={stage} onChange={e=>setStage(e.target.value)}>{["sowing","vegetative","flowering","maturity"].map(x=><option key={x} value={x}>{tr[x]}</option>)}</select></label>
          <button className="primary" disabled={busy}>{busy?tr.loading:tr.get} <CloudSun size={17}/></button>
        </form>
        {error&&<div className="error"><AlertTriangle size={16}/>{error}</div>}
      </section>

      {data&&<div className="results">
        <div className="section-title"><div><span className="number">02</span><h2>{tr.current}</h2></div><span className="location-pill"><MapPin size={14}/>{data.location}</span></div>
        <div className="metrics">
          <Metric icon={<Thermometer/>} label={tr.temp} value={`${Number(data.current.temperature_2m).toFixed(1)} °C`}/>
          <Metric icon={<Droplets/>} label={tr.humidity} value={`${data.current.relative_humidity_2m}%`}/>
          <Metric icon={<CloudSun/>} label={tr.rain} value={`${data.current.precipitation} mm`}/>
          <Metric icon={<Wind/>} label={tr.wind} value={`${data.current.wind_speed_10m} km/h`}/>
        </div>

        <div className="section-title"><div><span className="number">03</span><h2>{tr.forecast}</h2></div></div>
        <section className="panel chart-panel"><ResponsiveContainer width="100%" height={270}><LineChart data={chartData} margin={{top:10,right:16,left:0,bottom:4}}><CartesianGrid strokeDasharray="3 3" stroke="#e7eee9"/><XAxis dataKey="day"/><YAxis/><Tooltip/><Legend/><Line type="monotone" dataKey="max" name="Max °C" stroke="#218653" strokeWidth={3}/><Line type="monotone" dataKey="min" name="Min °C" stroke="#d59b43" strokeWidth={3}/></LineChart></ResponsiveContainer></section>
        <div className="forecast-cards">{chartData.map((d,i)=><div className="forecast-card" key={d.day}><b>{d.day}</b><strong>{Math.round(d.max)}° / {Math.round(d.min)}°</strong><small>🌧 {Number(d.rain||0).toFixed(1)} mm</small></div>)}</div>

        <div className="section-title"><div><span className="number">04</span><h2>{tr.alerts}</h2></div><span className="hint">Rule-based prototype alerts</span></div>
        {data.alerts.length===0?<div className="no-alert">✓ {tr.noAlerts}</div>:<div className="alert-list">{data.alerts.map((a,i)=><div className={`alert-card ${a.severity}`} key={`${a.date}-${a.type}-${i}`}><div className="alert-heading"><b>{tr[alertTitle[a.type]]}</b><span>{tr[a.severity]}</span></div><p>{a.date} · {a.type==="heavy_rain"?`${a.value} mm rainfall`:a.type==="extreme_heat"?`${a.value} °C maximum temperature`:`${a.value} °C with little/no rain`}</p></div>)}</div>}

        <section className="panel crop-advice"><div className="advice-icon">🌿</div><div><h3>{tr.advice} · {crop} ({tr[stage]})</h3><p>{data.crop_advice}</p></div></section>

        <section className="panel ai-panel">
          <div className="ai-head"><div className="ai-icon"><Sparkles/></div><div><h2>{tr.ai}</h2><p>{tr.aiDesc}</p></div></div>
          <button className="primary ai-button" onClick={askGemini} disabled={aiBusy}>{aiBusy?tr.asking:tr.ask}<Sparkles size={16}/></button>
          {aiAdvice&&<div className="ai-response"><b>Gemini AI Advisory</b><p>{aiAdvice}</p></div>}
        </section>
        <p className="source-note">Weather data: Open-Meteo · AI advisory: Google Gemini</p>
      </div>}

      <section className="panel history">
        <div className="section-title"><div><span className="number">05</span><h2>{tr.history}</h2></div><button className="refresh" onClick={loadHistory}><RefreshCw size={15}/></button></div>
        {history.length===0?<p className="muted">{tr.noHistory}</p>:history.map((h,i)=><div className="history-row" key={i}><span><b>{h.location}</b> · {h.crop} · {h.alert_type.replace("_"," ")}</span><small>{new Date(h.created_at).toLocaleString()}</small></div>)}
      </section>
      <footer><b>AgriWeather Alert</b> · Prototype Model · React + Flask + SQLite + Gemini<br/>{tr.disclaimer}</footer>
    </main>
  </div>;
}

function Metric({icon,label,value}){
  return <div className="metric"><div className="metric-icon">{icon}</div><span>{label}</span><b>{value}</b></div>;
}
