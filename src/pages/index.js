// pages/index.js
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import Link from "next/link";

export default function Home() {
  /* ------------ state ------------ */
  const [recipes, setRecipes] = useState([]);
  const [selected, setSelected] = useState(null); // view mode
  const [isEditing, setIsEditing] = useState(false); // switches to edit pane

  /* -- new fields + existing fields -- */
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Breakfast");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState(""); // multiline textarea
  const [steps, setSteps] = useState(""); // multiline textarea

  /* ------------ search / filter ------------ */
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(""); // category filter

  const categories = ["Breakfast", "Lunch", "Dinner", "Snacks", "Juice"];

  /* ------------ firestore CRUD ------------ */
  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    const snap = await getDocs(collection(db, "recipes"));
    setRecipes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const resetForm = () => {
    setName("");
    setCategory("Breakfast");
    setDescription("");
    setIngredients("");
    setSteps("");
  };

  /* ---------- add new ---------- */
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addDoc(collection(db, "recipes"), {
      name,
      category,
      description,
      ingredients: ingredients.split("\n").filter(Boolean),
      steps: steps.split("\n").filter(Boolean),
      created: Date.now(),
    });
    resetForm();
    fetchRecipes();
  };

  /* ---------- update ---------- */
  const handleSave = async () => {
    if (!selected) return;
    await updateDoc(doc(db, "recipes", selected.id), {
      name,
      category,
      description,
      ingredients: ingredients.split("\n").filter(Boolean),
      steps: steps.split("\n").filter(Boolean),
    });
    setSelected({
      ...selected,
      name,
      category,
      description,
      ingredients: ingredients.split("\n").filter(Boolean),
      steps: steps.split("\n").filter(Boolean),
    });
    setIsEditing(false);
    fetchRecipes();
  };

  /* ---------- delete ---------- */
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "recipes", id));
    if (selected?.id === id) setSelected(null);
    fetchRecipes();
  };

  /* ---------- choose recipe for view ---------- */
  const openRecipe = (recipe) => {
    setSelected(recipe);
    setIsEditing(false);
    // preload fields in case user hits edit next
    setName(recipe.name);
    setCategory(recipe.category);
    setDescription(recipe.description);
    setIngredients((recipe.ingredients || []).join("\n"));
    setSteps((recipe.steps || []).join("\n"));
  };

  /* ---------- search filter ---------- */
  const filteredRecipes = recipes.filter((r) => {
    const nameMatch = r.name.toLowerCase().includes(search.toLowerCase());
    const ingrMatch = (r.ingredients || [])
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
    const catMatch = filter ? r.category === filter : true;
    return (nameMatch || ingrMatch) && catMatch;
  });
  const [menuOpen, setMenuOpen] = useState(false);
  /* =================================================================== */
  console.log("menuOpen",menuOpen)
  return (
    <div className="app">
      {/* mobile menu button */}
      <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </div>

      {/* ------------- sidebar ------------- */}
      <div className={`sidebar ${menuOpen ? "open" : ""}`}>
        <h3>Categories</h3>
        <ul>
          <li
            className={!filter ? "active" : ""}
            onClick={() => {
              setFilter("");
              setSelected(null);
            }}
          >
            All Recipes
          </li>
          {categories.map((cat) => (
            <li
              key={cat}
              className={filter === cat ? "active" : ""}
              onClick={() => {
                setFilter(cat);
                setSelected(null);
              }}
            >
              {cat}
            </li>
          ))}
        </ul>
       
      </div>

      {/* ------------- list pane ------------- */}
      <main className="list-pane">
        <div className="search-box">
          <input
            placeholder="Search by name or ingredient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="add-btn"
            onClick={() => {
              resetForm();
              setSelected(null);
              setIsEditing(true);
            }}
          >
            <FaPlus />
          </button>
        </div>

        <ul className="note-list">
          {filteredRecipes.map((r) => (
            <li
              key={r.id}
              onClick={() => openRecipe(r)}
              className={selected?.id === r.id ? "selected" : ""}
            >
              <strong>{r.name}</strong>
              <div className="cat">{r.category}</div>
            </li>
          ))}
        </ul>
      </main>

      {/* ------------- detail / edit pane ------------- */}
      <section className="detail-pane">
        {selected && !isEditing && (
          <>
            <h2>{selected.name}</h2>
            <p className="muted">{selected.category}</p>

            <div className="section-title">Description</div>
            <p className="pre">{selected.description}</p>

            <div className="section-title">Ingredients</div>
            <ul>
              {(selected.ingredients || []).map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>

            <div className="section-title">Steps</div>
            <ol>
              {(selected.steps || []).map((st, i) => (
                <li key={i}>{st}</li>
              ))}
            </ol>

            <div className="icon-row">
              <FaEdit
                onClick={() => {
                  setIsEditing(true);
                }}
                title="Edit"
              />
              <FaTrash
                onClick={() => handleDelete(selected.id)}
                title="Delete"
              />
            </div>
          </>
        )}

        {!selected && !isEditing && (
          <div className="placeholder">
            Select a recipe or hit ➕ to add one
          </div>
        )}

        {isEditing && (
          <form
            className="edit-form"
            onSubmit={
              selected
                ? (e) => {
                    e.preventDefault();
                    handleSave();
                  }
                : handleAdd
            }
          >
            <input
              placeholder="Dish name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <textarea
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <textarea
              placeholder="Ingredients (one per line)"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
            />

            <textarea
              placeholder="Steps (one per line)"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
            />

            <div className="btn-row">
              <button type="submit">{selected ? "Save" : "Add"}</button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  if (!selected) resetForm();
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

     
    </div>
  );
}
