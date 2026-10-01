import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaFileAlt,
  FaSearch,
  FaEnvelope,
  FaSave,
  FaCheck,
} from "react-icons/fa";
import { getUserProfile, updateProfile, markWelcomeSeen } from "../api";

function GettingStarted() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const [bio, setBio] = useState("");
  const [interestsInput, setInterestsInput] = useState("");
  const [hobbiesInput, setHobbiesInput] = useState("");
  const [availability, setAvailability] = useState("");
  const [preferredLearningStyle, setPreferredLearningStyle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getUserProfile(userId, token);
        const { user } = res.data;
        setBio(user.bio || "");
        setInterestsInput((user.interests || []).join(", "));
        setHobbiesInput((user.hobbies || []).join(", "));
        setAvailability(user.availability || "");
        setPreferredLearningStyle(user.preferredLearningStyle || "");
      } catch {
        setError("We could not load your profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId, token]);

  const parseList = (str) =>
    str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSaveProfile = async () => {
    setSaving(true);
    setError("");
    try {
      await updateProfile(
        {
          bio,
          interests: parseList(interestsInput),
          hobbies: parseList(hobbiesInput),
          availability,
          preferredLearningStyle,
        },
        token
      );
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const finishOnboarding = async () => {
    try {
      await markWelcomeSeen(token);
    } catch {
      // silent fail
    }
    navigate("/browse");
  };

  const handleSkipAll = async () => {
    await finishOnboarding();
  };

  const handleContinue = async () => {
    await finishOnboarding();
  };

  if (loading) {
    return (
      <main className="page-container">
        <div className="empty-state"><p>Loading...</p></div>
      </main>
    );
  }

  return (
    <main className="page-container getting-started-page">
      <header className="gs-hero">
        <div className="gs-hero-badge">
          <span className="gs-hero-badge-icon">✦</span>
          Getting started
        </div>
        <h1>Welcome to SkillShare!</h1>
        <p>
          You're now part of a community that trades skills instead of money.
          Complete your profile to get the most out of your experience.
        </p>
      </header>

      {error && <p className="alert" style={{ marginBottom: 16 }}>{error}</p>}

      <section className="gs-card">
        <div className="gs-card-header">
          <span className="gs-card-step-number">1</span>
          <div className="gs-card-header-text">
            <h2>Complete your profile</h2>
            <p>Add a few details so others can find and connect with you.</p>
          </div>
        </div>

        <div className="form-stack">
          <div className="field">
            <label htmlFor="gs-bio">Bio</label>
            <textarea
              id="gs-bio"
              placeholder="Tell others a little about yourself and what you want to learn."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="gs-interests">Interests</label>
            <input
              id="gs-interests"
              placeholder="Separate with commas: Music, Programming, Language"
              value={interestsInput}
              onChange={(e) => setInterestsInput(e.target.value)}
            />
            <small className="field-hint">Separate each interest with a comma.</small>
          </div>

          <div className="field">
            <label htmlFor="gs-hobbies">Hobbies</label>
            <input
              id="gs-hobbies"
              placeholder="Separate with commas: Guitar, Reading, Hiking"
              value={hobbiesInput}
              onChange={(e) => setHobbiesInput(e.target.value)}
            />
            <small className="field-hint">Separate each hobby with a comma.</small>
          </div>

          <div className="field">
            <label htmlFor="gs-availability">Availability</label>
            <input
              id="gs-availability"
              placeholder="e.g., Weekends, Weekday evenings, Flexible"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            />
            <small className="field-hint">When are you usually available?</small>
          </div>

          <div className="field">
            <label htmlFor="gs-learning-style">Preferred learning style</label>
            <select
              id="gs-learning-style"
              value={preferredLearningStyle}
              onChange={(e) => setPreferredLearningStyle(e.target.value)}
            >
              <option value="">Not specified</option>
              <option value="visual">Visual (diagrams, videos)</option>
              <option value="auditory">Auditory (listening, discussion)</option>
              <option value="kinesthetic">Kinesthetic (hands-on practice)</option>
              <option value="reading">Reading/Writing (notes, articles)</option>
            </select>
          </div>

          <div className="gs-save-row">
            <button
              type="button"
              className="button"
              onClick={handleSaveProfile}
              disabled={saving || saved}
            >
              {saved ? (
                <>
                  <FaCheck aria-hidden="true" />
                  <span>Profile saved</span>
                </>
              ) : (
                <>
                  <FaSave aria-hidden="true" />
                  <span>{saving ? "Saving..." : "Save profile"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="gs-steps">
        <div className="gs-step">
          <span className="gs-step-icon"><FaFileAlt /></span>
          <div className="gs-step-body">
            <strong>Create your first skill post</strong>
            <p>Share what you can teach or want to learn.</p>
          </div>
          <Link className="gs-step-go" to="/create-post">Go →</Link>
        </div>

        <div className="gs-step">
          <span className="gs-step-icon"><FaSearch /></span>
          <div className="gs-step-body">
            <strong>Browse and find matches</strong>
            <p>Discover people with complementary skills.</p>
          </div>
          <Link className="gs-step-go" to="/browse">Go →</Link>
        </div>

        <div className="gs-step">
          <span className="gs-step-icon"><FaEnvelope /></span>
          <div className="gs-step-body">
            <strong>Send a message</strong>
            <p>Start a conversation about a skill exchange.</p>
          </div>
          <Link className="gs-step-go" to="/messages">Go →</Link>
        </div>
      </section>

      <div className="gs-actions">
        <div className="gs-actions-left">
          <button className="button-ghost" onClick={handleSkipAll}>
            Skip for now
          </button>
        </div>
        <div className="gs-actions-right">
          <button className="button" onClick={handleContinue}>
            Continue to SkillShare →
          </button>
        </div>
      </div>
    </main>
  );
}

export default GettingStarted;