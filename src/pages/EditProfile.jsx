import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSave, FaTimes } from "react-icons/fa";
import { getUserProfile, updateProfile } from "../api";
import { useUnsavedChangesWarning } from "../hooks/useUnsavedChangesWarning";
import { useConfirm } from "../contexts/ConfirmContext";

function EditProfile() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [interestsInput, setInterestsInput] = useState("");
  const [hobbiesInput, setHobbiesInput] = useState("");
  const [initialValues, setInitialValues] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getUserProfile(userId, token);
        const { user } = res.data;
        const loaded = {
          bio: user.bio || "",
          location: user.location || "",
          interestsInput: (user.interests || []).join(", "),
          hobbiesInput: (user.hobbies || []).join(", "),
        };
        setBio(loaded.bio);
        setLocation(loaded.location);
        setInterestsInput(loaded.interestsInput);
        setHobbiesInput(loaded.hobbiesInput);
        setInitialValues(loaded);
      } catch {
        setError("We could not load your profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId, token]);

  const currentValues = { bio, location, interestsInput, hobbiesInput };
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
      await updateProfile({ bio, location, interests, hobbies }, token);
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
    <main className="page-container profile-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Your profile</p>
          <h1>Edit your profile</h1>
          <p>Update your bio and interests so others can find and connect with you.</p>
        </div>
      </header>

      <section className="content-card post-form">
        <form className="form-stack" onSubmit={handleSubmit}>
          {error && <p className="alert">{error}</p>}
          {success && <p className="alert" style={{ background: "#eaf3de", color: "#3b6d11" }}>{success}</p>}

          <div className="field">
            <label htmlFor="profile-bio">Bio</label>
            <textarea
              id="profile-bio"
              placeholder="Tell others a little about yourself, your skills, and what you want to learn."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="profile-location">Location</label>
            <input
              id="profile-location"
              placeholder="e.g., Quezon City, Philippines"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
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

          <div className="form-actions">
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
    </main>
  );
}

export default EditProfile;