
import { useRef, useState } from "react";
import "./App.css";

const soundCategories = [
  { name: "Ambulance", icon: "🚑", type: "Emergency" },
  { name: "Police Siren", icon: "🚨", type: "Emergency" },
  { name: "Fire Truck", icon: "🚒", type: "Emergency" },
  { name: "Traffic & Horns", icon: "🚗", type: "Traffic" },
  { name: "Fire Alarm", icon: "🔥", type: "Safety" },
  { name: "Dog Barking", icon: "🐕", type: "Environment" },
];

const API = "http://127.0.0.1:8000";

export default function App() {
  const [mode, setMode] = useState("upload");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("Ready to test");
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [history, setHistory] = useState([]);
  const [serverStatus, setServerStatus] = useState("Checking...");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  async function checkServer() {
    try {
      const response = await fetch(`${API}/api/health`);
      if (!response.ok) throw new Error("Server error");
      setServerStatus("Connected");
    } catch {
      setServerStatus("Offline");
    }
  }

  async function uploadAudio(audioFile) {
    if (!audioFile) return;

    setLoading(true);
    setMessage("");
    setStatus("Uploading audio...");

    try {
      const data = new FormData();
      data.append("file", audioFile);

      const response = await fetch(`${API}/api/audio/upload`, {
        method: "POST",
        body: data,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || "Upload failed");
      }

      setStatus("Audio uploaded");
      setMessage(
        "Upload successful. AI model abhi connect nahi hai, isliye sound prediction available nahi hai."
      );

      setHistory((previous) => [
        {
          name: result.filename,
          time: new Date().toLocaleTimeString(),
          result: "Awaiting AI model",
        },
        ...previous,
      ]);
    } catch (error) {
      setStatus("Upload failed");
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function startRecording() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is not available in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const extension = type.includes("mp4") ? "m4a" : "webm";
        const audioFile = new File(
          chunksRef.current,
          `microphone-${Date.now()}.${extension}`,
          { type }
        );

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);

        if (audioFile.size > 0) {
          uploadAudio(audioFile);
        } else {
          setMessage("Audio record nahi hua. Dobara try karo.");
        }
      };

      recorder.start();
      setRecording(true);
      setStatus("Recording...");
      setMessage("Microphone recording active hai. Stop par click karo.");
    } catch (error) {
      setRecording(false);
      setStatus("Microphone unavailable");
      setMessage(error.message);
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">◉</div>
          <div>
            <h2>SoundAI</h2>
            <span>INTELLIGENCE SYSTEM</span>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>
        <div className="nav-item active">▦ &nbsp; Overview</div>
        <div className="nav-item">◉ &nbsp; Sound Detection</div>
        <div className="nav-item">▤ &nbsp; Detection History</div>
        <div className="nav-item">▧ &nbsp; Dataset Library</div>

        <div className="sidebar-bottom">
          <div className="status-dot" />
          <span>API: {serverStatus}</span>
          <button className="refresh" onClick={checkServer}>
            ↻
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">AI-POWERED AUDIO ANALYTICS</p>
            <h1>Sound Intelligence Dashboard</h1>
            <p className="subtitle">
              Monitor and analyze environmental sounds in one place.
            </p>
          </div>
          <div className="online-pill">
            <span /> {serverStatus}
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">◉</span>
            <p>AI Model</p>
            <h2>Not Connected</h2>
            <small>Training and integration pending</small>
          </div>
          <div className="stat-card">
            <span className="stat-icon">♫</span>
            <p>Audio Files</p>
            <h2>{history.length}</h2>
            <small>Uploaded this session</small>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⌁</span>
            <p>Detection Events</p>
            <h2>0</h2>
            <small>Predictions after model integration</small>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel detector-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">AUDIO INPUT</p>
                <h2>Sound Detection</h2>
              </div>
              <span className="neutral-pill">Prototype</span>
            </div>

            <div className="mode-tabs">
              <button
                className={mode === "upload" ? "selected" : ""}
                onClick={() => {
                  setMode("upload");
                  setMessage("");
                }}
              >
                ↑ Upload Audio
              </button>
              <button
                className={mode === "live" ? "selected" : ""}
                onClick={() => {
                  setMode("live");
                  setMessage("");
                }}
              >
                ◉ Live Microphone
              </button>
            </div>

            {mode === "upload" ? (
              <div
                className="upload-zone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  setFile(event.dataTransfer.files[0] || null);
                }}
              >
                <div className="upload-icon">♫</div>
                <h3>Upload an audio file</h3>
                <p>Choose a recording to send to the backend.</p>
                <button
                  className="secondary-button"
                  onClick={() => inputRef.current?.click()}
                >
                  Browse files
                </button>
                <input
                  ref={inputRef}
                  hidden
                  type="file"
                  accept="audio/*"
                  onChange={(event) =>
                    setFile(event.target.files?.[0] || null)
                  }
                />
                <small>WAV, MP3, OGG, FLAC · Maximum 25 MB</small>
                {file && <p className="file-name">{file.name}</p>}
                <button
                  className="primary-button"
                  disabled={!file || loading}
                  onClick={() => uploadAudio(file)}
                >
                  {loading ? "Uploading..." : "Upload & Analyze"}
                </button>
              </div>
            ) : (
              <div className="upload-zone microphone-zone">
                <div className="mic-circle">🎙️</div>
                <h3>{recording ? "Recording audio..." : "Live microphone"}</h3>
                <p>
                  Record a short audio sample, then send it to the backend.
                </p>
                {!recording ? (
                  <button
                    className="primary-button"
                    disabled={loading}
                    onClick={startRecording}
                  >
                    Start Recording
                  </button>
                ) : (
                  <button className="stop-button" onClick={stopRecording}>
                    Stop & Upload
                  </button>
                )}
                <small>Browser microphone permission is required.</small>
              </div>
            )}

            <div className="result-box">
              <p className="eyebrow">PROCESSING STATUS</p>
              <h3>{status}</h3>
              <p>{message || "Upload audio or record a sample to begin."}</p>
            </div>
          </div>

          <div className="panel categories-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">CLASS LIBRARY</p>
                <h2>Sound Categories</h2>
              </div>
              <span className="count-pill">{soundCategories.length}</span>
            </div>

            <p className="section-description">
              Target classes planned for the AI model.
            </p>

            <div className="category-list">
              {soundCategories.map((sound) => (
                <div className="category-row" key={sound.name}>
                  <div className="category-icon">{sound.icon}</div>
                  <div className="category-info">
                    <strong>{sound.name}</strong>
                    <span>{sound.type}</span>
                  </div>
                  <span className="planned-pill">Planned</span>
                </div>
              ))}
            </div>

            <div className="note-box">
              <strong>Next milestone</strong>
              <p>
                Integrate a trained CNN model to produce real sound
                predictions and confidence scores.
              </p>
            </div>
          </div>
        </section>

        <section className="panel history-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">RECENT ACTIVITY</p>
              <h2>Audio Upload History</h2>
            </div>
          </div>
          {history.length === 0 ? (
            <p className="empty-state">
              No audio files uploaded in this session yet.
            </p>
          ) : (
            <div className="history-list">
              {history.map((item, index) => (
                <div className="history-row" key={`${item.name}-${index}`}>
                  <span className="history-icon">♫</span>
                  <div className="history-name">
                    <strong>{item.name}</strong>
                    <small>{item.time}</small>
                  </div>
                  <span className="neutral-pill">{item.result}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer>
          SoundAI Prototype · CNN integration pending · No real predictions yet
        </footer>
      </main>
    </div>
  );
}
