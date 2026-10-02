import { FaStar } from "react-icons/fa";

function StarRating({ value = 0, onChange = null, size = "md", readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];
  const interactive = Boolean(onChange) && !readOnly;

  const sizeClass = size === "sm" ? "star-sm" : size === "lg" ? "star-lg" : "star-md";

  return (
    <div
      className={`star-rating ${sizeClass} ${interactive ? "star-interactive" : ""}`}
      role={interactive ? "radiogroup" : "img"}
      aria-label={interactive ? "Select rating" : `Rating: ${value} out of 5`}
    >
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= value ? "star-filled" : "star-empty"}`}
          onClick={interactive ? () => onChange(star) : undefined}
          disabled={!interactive}
          aria-label={interactive ? `${star} star${star > 1 ? "s" : ""}` : undefined}
          tabIndex={interactive ? 0 : -1}
        >
          <FaStar />
        </button>
      ))}
    </div>
  );
}

export default StarRating;