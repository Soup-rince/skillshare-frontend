import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaImage, FaTimes, FaPlus } from "react-icons/fa";
import { createPost, updatePost, getPostById, uploadPostImage } from "../api";
import { useUnsavedChangesWarning } from "../hooks/useUnsavedChangesWarning";
import { useConfirm } from "../contexts/ConfirmContext";
import { CATEGORIES } from "../constants/categories";

const emptyForm = {
  title: "",
  description: "",
  category: "music",
  proficiencyLevel: "beginner",
  postType: "offer",
  images: [],
};

function CreatePost() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const token = localStorage.getItem("token");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("music");
  const [proficiencyLevel, setProficiencyLevel] = useState("beginner");
  const [postType, setPostType] = useState("offer");
  const [images, setImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [initialValues, setInitialValues] = useState(isEditMode ? null : emptyForm);
  const imageInputRef = useRef(null);

  useEffect(() => {
    if (!isEditMode) return;
    const loadPost = async () => {
      try {
        const res = await getPostById(id);
        const loaded = {
          title: res.data.title,
          description: res.data.description,
          category: res.data.category,
          proficiencyLevel: res.data.proficiencyLevel,
          postType: res.data.postType,
          images: res.data.images || [],
        };
        setTitle(loaded.title);
        setDescription(loaded.description);
        setCategory(loaded.category);
        setProficiencyLevel(loaded.proficiencyLevel);
        setPostType(loaded.postType);
        setImages(loaded.images);
        setInitialValues(loaded);
      } catch {
        setError("We could not load this post.");
      }
    };
    loadPost();
  }, [id, isEditMode]);

  const currentValues = { title, description, category, proficiencyLevel, postType, images };
  const isDirty = initialValues !== null && JSON.stringify(currentValues) !== JSON.stringify(initialValues);

  useUnsavedChangesWarning(isDirty, {
    message: "If you leave now, your edits will be lost.",
  });

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= 3) {
      setError("Maximum 3 images per post.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }

    try {
      setUploadingImage(true);
      setError("");
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadPostImage(formData, token);
      setImages((current) => [...current, res.data.imageUrl]);
      e.target.value = "";
    } catch (err) {
      setError(err.response?.data?.message || "Could not upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index) => {
    setImages((current) => current.filter((_, i) => i !== index));
  };

  const handleCancel = async () => {
    if (!isDirty) {
      navigate(-1);
      return;
    }
    const shouldLeave = await confirm({
      title: "Unsaved changes",
      message: "If you leave now, your edits will be lost.",
      confirmLabel: "Discard changes",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (shouldLeave) navigate(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !description.trim()) {
      setError("Title and description cannot be empty.");
      return;
    }
    const payload = { title, description, category, proficiencyLevel, postType, images };
    try {
      if (isEditMode) {
        await updatePost(id, payload, token);
        setInitialValues(payload);
        navigate(`/posts/${id}`);
      } else {
        const res = await createPost(payload, token);
        navigate(`/posts/${res.data._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <main className="page-container">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Skill exchange</p>
          <h1>{isEditMode ? "Edit your skill post" : "Share a skill"}</h1>
          <p>
            {isEditMode
              ? "Keep your post clear and up to date."
              : "Tell the community what you can teach or want to learn."}
          </p>
        </div>
      </header>
      <section className="content-card post-form">
        <form className="form-stack" onSubmit={handleSubmit}>
          {error && <p className="alert">{error}</p>}
          <div className="field">
            <label htmlFor="post-title">Post title</label>
            <input
              id="post-title"
              placeholder="e.g., I can teach beginner guitar"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="post-description">Description</label>
            <textarea
              id="post-description"
              placeholder="Describe the skill, your experience, and what you are looking for."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Images (optional, max 3)</label>
            <div className="post-image-grid">
              {images.map((url, i) => (
                <div className="post-image-preview" key={i}>
                  <img src={url} alt={`Upload ${i + 1}`} />
                  <button
                    type="button"
                    className="post-image-remove"
                    onClick={() => handleRemoveImage(i)}
                    aria-label="Remove image"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <button
                  type="button"
                  className="post-image-add"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <span>Uploading...</span>
                  ) : (
                    <>
                      <FaPlus />
                      <span>Add image</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageSelect}
            />
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="post-category">Category</label>
              <select id="post-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="post-level">Proficiency level</label>
              <select id="post-level" value={proficiencyLevel} onChange={(e) => setProficiencyLevel(e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="post-type">I want to...</label>
            <select id="post-type" value={postType} onChange={(e) => setPostType(e.target.value)}>
              <option value="offer">Offer — I can teach this</option>
              <option value="request">Request — I want to learn this</option>
            </select>
          </div>
          <div className="form-actions">
            <button className="button-secondary" type="button" onClick={handleCancel}>Cancel</button>
            <button className="button" type="submit">{isEditMode ? "Save changes" : "Publish post"}</button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default CreatePost;