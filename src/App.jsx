
import { useState } from "react";
import "./App.css";
import api from "./api/axios";

const initialAnswers = {
  name: "",
  section: "",
  rollNumber: "",
  foodPreference: "",
};

const steps = [
  { label: "IDENTITY", code: "01" },
  { label: "SECTION", code: "02" },
  { label: "ROLL NUMBER", code: "03" },
  { label: "FOOD PROTOCOL", code: "04" },
];

export default function App() {
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [direction, setDirection] = useState("next");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (field, value) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const moveTo = (nextScreen) => {
    setDirection(nextScreen > screen ? "next" : "back");
    setError("");
    setScreen(nextScreen);
  };

  const continueQuestion = () => {
    if (screen === 1 && !answers.name.trim()) {
      setError("Please enter your name to continue.");
      return;
    }

    if (screen === 2 && !answers.section) {
      setError("Select your MCA section first.");
      return;
    }

    if (screen === 3 && !answers.rollNumber.trim()) {
      setError("Your roll number is required.");
      return;
    }

    if (screen === 4 && !answers.foodPreference) {
      setError("Choose your food preference.");
      return;
    }

    moveTo(screen + 1);
  };

  // Send the answers to Express, which saves them in CockroachDB.
  const saveResponse = async () => {
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: answers.name.trim(),
        section: answers.section,
        rollNumber: answers.rollNumber.trim(),
        foodPreference: answers.foodPreference,
      };

      const response = await api.post("/api/responses", payload);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to save your response."
        );
      }

      // Reveal the poster only after the backend confirms success.
      moveTo(6);
    } catch (err) {
      if (err.response?.status === 409) {
        setError(
          err.response.data?.message ||
            "This roll number has already submitted a response."
        );
      } else {
        setError(
          err.response?.data?.message ||
            (err.code === "ECONNABORTED"
              ? "The request timed out. Please try again."
              : "Unable to save your response. Check your connection and try again.")
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const resetExperience = () => {
    setAnswers(initialAnswers);
    moveTo(0);
  };

  const renderQuestion = () => {
    switch (screen) {
      case 1:
        return (
          <>
            <p className="eyebrow">IDENTITY VERIFICATION // 01</p>
            <h1>
              What is your <span>good name?</span>
            </h1>
            <p className="description">
              Every legend needs a name. Let's start there.
            </p>
            <label className="field-label" htmlFor="junior-name">
              YOUR NAME
            </label>
            <input
              id="junior-name"
              autoFocus
              className="tech-input"
              placeholder="Enter your name..."
              value={answers.name}
              onChange={(e) => update("name", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") continueQuestion();
              }}
              maxLength={80}
            />
          </>
        );

      case 2:
        return (
          <>
            <p className="eyebrow">ACADEMIC SCAN // 02</p>
            <h1>
              Which section are <span>you from?</span>
            </h1>
            <p className="description">
              Locating your position in the MCA universe.
            </p>
            <label className="field-label" htmlFor="junior-section">
              MCA FIRST YEAR / SECTION
            </label>
            <select
              id="junior-section"
              className="tech-input"
              value={answers.section}
              onChange={(e) => update("section", e.target.value)}
            >
              <option value="">Select your section</option>
              <option value="A">SECTION A</option>
              <option value="B">SECTION B</option>
              <option value="C">SECTION C</option>
            </select>
          </>
        );

      case 3:
        return (
          <>
            <p className="eyebrow">RECORD MATCH // 03</p>
            <h1>
              Enter your <span>roll number.</span>
            </h1>
            <p className="description">
              Just a tiny check before the system proceeds.
            </p>
            <label className="field-label" htmlFor="junior-roll">
              UNIVERSITY / COLLEGE ROLL NUMBER
            </label>
            <input
              id="junior-roll"
              className="tech-input"
              placeholder="Enter your roll number..."
              value={answers.rollNumber}
              onChange={(e) => update("rollNumber", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") continueQuestion();
              }}
              maxLength={30}
            />
          </>
        );

      case 4:
        return (
          <>
            <p className="eyebrow">CRITICAL SYSTEM QUERY // 04</p>
            <h1>
              One serious <span>question.</span>
            </h1>
            <p className="description">
              Our party planning algorithm needs this information.
            </p>
            <p className="food-question">What goes on your plate?</p>
            <div className="choice-grid">
              <button
                type="button"
                className={`choice-card ${
                  answers.foodPreference === "Veg" ? "selected" : ""
                }`}
                onClick={() => update("foodPreference", "Veg")}
              >
                <span className="choice-icon">🥗</span>
                <span>VEG</span>
                <small>Plant-powered</small>
              </button>

              <button
                type="button"
                className={`choice-card ${
                  answers.foodPreference === "Non-Veg" ? "selected" : ""
                }`}
                onClick={() => update("foodPreference", "Non-Veg")}
              >
                <span className="choice-icon">🍗</span>
                <span>NON-VEG</span>
                <small>Protein protocol</small>
              </button>
            </div>
          </>
        );

      case 5:
        return (
          <div className="reveal-content">
            <div className="heart-orbit">
              <span>♥</span>
            </div>

            <p className="eyebrow">DATA COLLECTION // COMPLETE</p>
            <h1>
              Your data is saved
              <br />
              in our <span>heart.</span>
            </h1>

            <p className="description">
              All checks complete, {answers.name.trim()}.
              <br />
              One final step remains.
            </p>

            <p className="terminal-line">
              &gt; SECRET_INVITATION.exe is ready
            </p>

            <button
              type="button"
              className="primary-button reveal-button"
              onClick={saveResponse}
              disabled={saving}
            >
              {saving ? "SAVING YOUR RESPONSE..." : "YES, REVEAL IT"}
              {!saving && <span> ↗</span>}
            </button>

            <p className="micro-copy">
              {saving
                ? "TRANSMITTING DATA TO THE SERVER..."
                : "WARNING: happiness may increase."}
            </p>
          </div>
        );

      case 6:
        return (
          <div className="poster-content">
            <p className="eyebrow">TRANSMISSION RECEIVED // SUCCESS</p>
            <h1>
              You're <span>invited!</span>
            </h1>
            <p className="description">
              The secret is out. Get ready for a good time.
            </p>

            <div className="poster-frame">
              <img
                src="/invitation-poster.png"
                alt="MCA juniors party invitation poster"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling.style.display = "flex";
                }}
              />

              <div className="poster-placeholder">
                <span className="placeholder-icon">✳</span>
                <strong>YOUR PARTY POSTER</strong>
                <span>
                  Add invitation-poster.png to the public folder
                </span>
              </div>
            </div>

            <p className="terminal-line">
              &gt; ATTENDANCE_STATUS: HOPEFULLY_CONFIRMED
            </p>

            <button
              type="button"
              className="secondary-button"
              onClick={resetExperience}
            >
              ↻ RESTART EXPERIENCE
            </button>
          </div>
        );

      default:
        return (
          <div className="welcome-content">
            <div className="system-icon">
              <span>MCA</span>
              <i />
            </div>

            <p className="eyebrow">
              INCOMING TRANSMISSION // MCA NETWORK
            </p>

            <h1>
              Hello, <span>Juniors!</span>
            </h1>

            <p className="description">
              Want to witness a joyful surprise?
              <br />
              Something special is waiting for you.
            </p>

            <div className="boot-status">
              <span className="status-dot" />
              SURPRISE PROTOCOL INITIALIZED
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() => moveTo(1)}
            >
              LET'S BEGIN <span>→</span>
            </button>

            <p className="micro-copy">
              [ ACCESS GRANTED TO MCA JUNIORS ]
            </p>
          </div>
        );
    }
  };

  const isQuestion = screen >= 1 && screen <= 4;
  const activeStep = isQuestion ? screen - 1 : 0;

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            👍<span>.</span>
          </div>
          <div>
            <strong>
              JUNIOR<span>.OS</span>
            </strong>
            <small>THE SURPRISE INITIATIVE</small>
          </div>
        </div>

        <div className="connection-status">
          <span className="status-dot" />
          SYSTEM ONLINE
        </div>
      </header>

      <section className="experience">
        <div className="side-code left-code">
          <span>KP // 2026</span>
          <span>CONFIDENTIAL</span>
          <span>ENCRYPTED JOY</span>
        </div>

        <div className="main-panel">
          {isQuestion && (
            <div className="progress-area">
              <div className="progress-heading">
                <span>PROGRESS TRACKER</span>
                <span>0{activeStep + 1} / 04</span>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${((activeStep + 1) / 4) * 100}%`,
                  }}
                />
              </div>

              <div className="step-labels">
                {steps.map((item, index) => (
                  <span
                    key={item.code}
                    className={index <= activeStep ? "step-active" : ""}
                  >
                    {item.code}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div key={screen} className={`screen-content slide-${direction}`}>
            {renderQuestion()}

            {error && (
              <p className="error-message" role="alert">
                <span>!</span> {error}
              </p>
            )}

            {isQuestion && (
              <div className="navigation-row">
                <button
                  type="button"
                  className="back-button"
                  onClick={() => moveTo(screen - 1)}
                >
                  ← BACK
                </button>

                <button
                  type="button"
                  className="primary-button next-button"
                  onClick={continueQuestion}
                >
                  CONTINUE <span>→</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="side-code right-code">
          <span>LAT: MCA_FIRST_YEAR</span>
          <span>MODE: SURPRISE</span>
          <span>STATUS: CLASSIFIED</span>
        </div>
      </section>

      <footer className="footer">
        <span>© 2026 // BUILT FOR THE MCA CREW</span>
        <span className="footer-center">
          GOOD VIBES. GREAT MEMORIES.
        </span>
        <span>
          END-TO-END JOY <b>●</b>
        </span>
      </footer>
    </main>
  );
}
