import { useNavigate } from "react-router-dom";
import { FaUser, FaFileAlt, FaSearch, FaEnvelope, FaTimes } from "react-icons/fa";

function WelcomeModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSkip = () => {
    onClose();
    navigate("/browse");
  };

  const handleGetStarted = () => {
    onClose();
    navigate("/profile/edit");
  };

  return (
    <div className="welcome-overlay">
      <div className="welcome-modal">
        <button className="welcome-close" onClick={handleSkip} aria-label="Close">
          <FaTimes />
        </button>

        <header className="welcome-header">
          <h1>Welcome to SkillShare!</h1>
          <p>You're now part of a community that trades skills instead of money. Here's how to get started:</p>
        </header>

        <div className="welcome-steps">
          <div className="welcome-step">
            <span className="welcome-step-icon"><FaUser /></span>
            <div>
              <strong>Complete your profile</strong>
              <p>Add your bio, location, and interests so others can find you.</p>
            </div>
          </div>

          <div className="welcome-step">
            <span className="welcome-step-icon"><FaFileAlt /></span>
            <div>
              <strong>Create your first skill post</strong>
              <p>Share what you can teach or want to learn.</p>
            </div>
          </div>

          <div className="welcome-step">
            <span className="welcome-step-icon"><FaSearch /></span>
            <div>
              <strong>Browse and find matches</strong>
              <p>Discover people with complementary skills.</p>
            </div>
          </div>

          <div className="welcome-step">
            <span className="welcome-step-icon"><FaEnvelope /></span>
            <div>
              <strong>Send a message</strong>
              <p>Start a conversation about a skill exchange.</p>
            </div>
          </div>
        </div>

        <div className="welcome-actions">
          <button className="button-secondary" onClick={handleSkip}>Skip for now</button>
          <button className="button" onClick={handleGetStarted}>Let's get started →</button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeModal;