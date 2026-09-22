import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPost, updatePost, getPostById } from "../api";

function CreatePost() {
  const { id } = useParams(); // may laman lang kung "edit mode"
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("music");
  const [proficiencyLevel, setProficiencyLevel] = useState("beginner");
  const [postType, setPostType] = useState("offer");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEditMode) {
      const loadPost = async () => {
        const res = await getPostById(id);
        setTitle(res.data.title);
        setDescription(res.data.description);
        setCategory(res.data.category);
        setProficiencyLevel(res.data.proficiencyLevel);
        setPostType(res.data.postType);
      };
      loadPost();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !description.trim()) {
      setError("Title and description cannot be empty.");
      return;
    }

    const payload = { title, description, category, proficiencyLevel, postType };

    try {
      if (isEditMode) {
        await updatePost(id, payload, token);
        navigate(`/posts/${id}`);
      } else {
        const res = await createPost(payload, token);
        navigate(`/posts/${res.data._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "30px auto" }}>
      <h2>{isEditMode ? "Edit Post" : "Create a Skill Post"}</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8, marginBottom: 12 }}
        />

        <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8, marginBottom: 12, minHeight: 80 }}
        />

        <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8, marginBottom: 12 }}
        >
          <option value="music">Music</option>
          <option value="programming">Programming</option>
          <option value="language">Language</option>
          <option value="art">Art</option>
        </select>

        <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Proficiency Level</label>
        <select
          value={proficiencyLevel}
          onChange={(e) => setProficiencyLevel(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8, marginBottom: 12 }}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Post Type</label>
        <select
          value={postType}
          onChange={(e) => setPostType(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8, marginBottom: 16 }}
        >
          <option value="offer">Offer — I can teach this</option>
          <option value="request">Request — I want to learn this</option>
        </select>

        <button type="submit" style={{ width: "100%", padding: 10 }}>
          {isEditMode ? "Save Changes" : "Create Post"}
        </button>
      </form>
    </div>
  );
}

export default CreatePost;