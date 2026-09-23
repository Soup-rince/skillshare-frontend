import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPost, updatePost, getPostById } from "../api";

function CreatePost() {
  const { id } = useParams();
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
    if (!isEditMode) return;
    const loadPost = async () => {
      try {
        const res = await getPostById(id);
        setTitle(res.data.title); setDescription(res.data.description); setCategory(res.data.category);
        setProficiencyLevel(res.data.proficiencyLevel); setPostType(res.data.postType);
      } catch { setError("We could not load this post."); }
    };
    loadPost();
  }, [id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !description.trim()) { setError("Title and description cannot be empty."); return; }
    const payload = { title, description, category, proficiencyLevel, postType };
    try {
      if (isEditMode) { await updatePost(id, payload, token); navigate(`/posts/${id}`); }
      else { const res = await createPost(payload, token); navigate(`/posts/${res.data._id}`); }
    } catch (err) { setError(err.response?.data?.message || "Something went wrong. Please try again."); }
  };

  return (
    <main className="page-container">
      <header className="page-heading">
        <div><p className="eyebrow">Skill exchange</p><h1>{isEditMode ? "Edit your skill post" : "Share a skill"}</h1><p>{isEditMode ? "Keep your post clear and up to date." : "Tell the community what you can teach or want to learn."}</p></div>
      </header>
      <section className="content-card post-form">
        <form className="form-stack" onSubmit={handleSubmit}>
          {error && <p className="alert">{error}</p>}
          <div className="field"><label htmlFor="post-title">Post title</label><input id="post-title" placeholder="e.g., I can teach beginner guitar" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="field"><label htmlFor="post-description">Description</label><textarea id="post-description" placeholder="Describe the skill, your experience, and what you are looking for." value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="form-grid">
            <div className="field"><label htmlFor="post-category">Category</label><select id="post-category" value={category} onChange={(e) => setCategory(e.target.value)}><option value="music">Music</option><option value="programming">Programming</option><option value="language">Language</option><option value="art">Art</option></select></div>
            <div className="field"><label htmlFor="post-level">Proficiency level</label><select id="post-level" value={proficiencyLevel} onChange={(e) => setProficiencyLevel(e.target.value)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
          </div>
          <div className="field"><label htmlFor="post-type">I want to...</label><select id="post-type" value={postType} onChange={(e) => setPostType(e.target.value)}><option value="offer">Offer — I can teach this</option><option value="request">Request — I want to learn this</option></select></div>
          <div className="form-actions"><button className="button-secondary" type="button" onClick={() => navigate(-1)}>Cancel</button><button className="button" type="submit">{isEditMode ? "Save changes" : "Publish post"}</button></div>
        </form>
      </section>
    </main>
  );
}

export default CreatePost;
