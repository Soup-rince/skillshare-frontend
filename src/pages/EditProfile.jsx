import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSave, FaTimes } from "react-icons/fa";
import { getUserProfile, updateProfile } from "../api";
import { useUnsavedChangesWarning } from "../hooks/useUnsavedChangesWarning";
import { useConfirm } from "../contexts/ConfirmContext";

function getInitials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getAvatarColor(name) {
  const palette = ["#2639ba", "#087b75", "#7c3aed", "#c2410c", "#be123c", "#0369a1"];
  if (!name) return palette[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

function EditProfile() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const [userName, setUserName] = useState("");
  const [bio, setBio] = useState("");
  const [interestsInput, setInterestsInput] = useState("");
  const [hobbiesInput, setHobbiesInput] = useState("");
  const [availability, setAvailability] = useState("");
  const [preferredLearningStyle, setPreferredLearningStyle] = useState("");
  const [initialValues, setInitialValues] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getUserProfile(userId, token);
        const { user } = res.data;
        setUserName(user.name || "");
        const loaded = {
          bio: user.bio || "",
          interestsInput: (user.interests || []).join(", "),
          hobbiesInput: (user.hobbies || []).join(", "),
          availability: user.availability || "",
          preferredLearningStyle: user.preferredLearningStyle || "",
        };
        setBio(loaded.bio);
        setInterestsInput(loaded.interestsInput);
        setHobbiesInput(loaded.hobbiesInput);
        setAvailability(loaded.availability);
        setPreferredLearningStyle(loaded.preferredLearningStyle);
        setInitialValues(loaded);
      } catch {
        setError("We could not load your profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId, token]);

  const currentValues = { bio, interestsInput, hobbiesInput, availability, preferredLearningStyle };
  const isDirty =
    initialValues !== null &&
    JSON.stringify(currentValues) !== JSON.stringify(initialValues);

  useUnsavedChangesWarning(isDirty, {
    message: "If you leave now, your profile changes will be lost.",
  });

  const parseList = (str) =>
    str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const handleCancel = async () => {
    if (!isDirty) {
      navigate(`/profile/${userId}`);
      return;
    }
    const shouldLeave = await confirm({
      title: "Unsaved changes",
      message: "If you leave now, your profile changes will be lost.",
      confirmLabel: "Discard changes",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (shouldLeave) navigate(`/profile/${userId}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const interests = parseList(interestsInput);
    const hobbies = parseList(hobbiesInput);

    try {
      await updateProfile(
        { bio, interests, hobbies, availability, preferredLearningStyle },
        token
      );
      setInitialValues(currentValues);
      setSuccess("Profile updated successfully.");
      setTimeout(() => navigate(`/profile/${userId}`), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update profile. Please try again.");
    }
  };

  if (loading) {
    return (
      <main className="page-container">
        <div className="empty-state"><p>Loading your profile...</p></div>
      </main>
    );
  }

  return (
    <main className="page-container edit-profile-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Your profile</p>
          <h1>Edit your profile</h1>
          <p>Update your bio and interests so others can find and connect with you.</p>
        </div>
      </header>

      <div className="edit-profile-grid">
        <aside className="edit-profile-sidebar">
          <div className="edit-profile-avatar-card">
            <div
              className="edit-profile-avatar"
              style={{ background: getAvatarColor(userName) }}
            >
              {getInitials(userName)}
            </div>
            <h2>{userName || "Your Name"}</h2>
            <p>SkillShare member</p>
          </div>
        </aside>

        <section className="edit-profile-main">
          <form className="edit-profile-form" onSubmit={handleSubmit}>
            {error && <p className="alert">{error}</p>}
            {success && <p className="alert" style={{ background: "#eaf3de", color: "#3b6d11" }}>{success}</p>}

            <div className="edit-profile-fields">
              <div className="field">
                <label htmlFor="profile-bio">Bio</label>
                <textarea
                  id="profile-bio"
                  placeholder="Tell others a little about yourself, your skills, and what you want to learn."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
                <small className="field-hint">A short summary helps other members understand what you offer.</small>
              </div>

              <div className="field">
                <label htmlFor="profile-interests">Interests</label>
                <input
                  id="profile-interests"
                  placeholder="Separate with commas: Music, Programming, Language"
                  value={interestsInput}
                  onChange={(e) => setInterestsInput(e.target.value)}
                />
                <small className="field-hint">Separate each interest with a comma.</small>
              </div>

              <div className="field">
                <label htmlFor="profile-hobbies">Hobbies</label>
                <input
                  id="profile-hobbies"
                  placeholder="Separate with commas: Guitar, Reading, Hiking"
                  value={hobbiesInput}
                  onChange={(e) => setHobbiesInput(e.target.value)}
                />
                <small className="field-hint">Separate each hobby with a comma.</small>
              </div>

              <div className="field">
                <label htmlFor="profile-availability">Availability</label>
                <input
                  id="profile-availability"
                  placeholder="e.g., Weekends, Weekday evenings, Flexible"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                />
                <small className="field-hint">When are you usually available for skill exchanges?</small>
              </div>

              <div className="field">
                <label htmlFor="profile-learning-style">Preferred learning style</label>
                <select
                  id="profile-learning-style"
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
            </div>

            <div className="edit-profile-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={handleCancel}
              >
                <FaTimes aria-hidden="true" />
                <span>Cancel</span>
              </button>
              <button type="submit" className="button">
                <FaSave aria-hidden="true" />
                <span>Save changes</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default EditProfile;