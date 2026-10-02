import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import StarRating from "./StarRating";

function ReviewForm({ isOpen, revieweeId, revieweeName, onClose, onSubmit, existingReview }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && existingReview) {
      setRating(existingReview.rating || 0);
      setComment(existingReview.comment || "");
    } else if (isOpen) {
      setRating(0);
      setComment("");
    }
    setError("");
  }, [isOpen, existingReview]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!rating) {
      setError("Please select a rating.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({ reviewee: revieweeId, rating, comment });
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <button className="review-close" onClick={onClose} aria-label="Close">
          <FaTimes />
        </button>

        <header className="review-header">
          <h2>{existingReview ? "Update your review" : "Leave a review"}</h2>
          <p>Share your experience with {revieweeName}</p>
        </header>

        <form className="review-form" onSubmit={handleSubmit}>
          {error && <p className="alert">{error}</p>}

          <div className="review-stars-field">
            <label>Rating</label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <div className="field">
            <label htmlFor="review-comment">Comment (optional)</label>
            <textarea
              id="review-comment"
              placeholder="Tell others about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
            />
            <small className="field-hint">{comment.length}/500 characters</small>
          </div>

          <div className="review-actions">
            <button type="button" className="button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button" disabled={submitting}>
              {submitting ? "Submitting..." : existingReview ? "Update review" : "Submit review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewForm;