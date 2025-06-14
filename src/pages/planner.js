// UPDATED pages/planner.js – supports multiple dishes per meal cell
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { db } from "../lib/firebase";
import { collection, doc, getDocs, getDoc, setDoc } from "firebase/firestore";
import { FaPlus, FaTrash, FaTimes, FaChevronLeft } from "react-icons/fa";
import { FaCirclePlus } from "react-icons/fa6";
/* ───────── config ───────── */
const mealTypes = ["Breakfast", "Lunch", "Dinner", "Evening"]; // keep original labels
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function Planner() {
  /* ───────── state ───────── */
  const [mealPlan, setMealPlan] = useState({}); // { Monday: { Breakfast:[id1,id2] } }
  const [recipes, setRecipes] = useState([]);
  const [popup, setPopup] = useState({ day: null, type: null });
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [grocery, setGrocery] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});

  const router = useRouter();

  /* ───────── load ───────── */
  useEffect(() => {
    fetchRecipes();
    fetchPlan();
  }, []);
  const fetchRecipes = async () => {
    const snap = await getDocs(collection(db, "recipes"));
    setRecipes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };
  const fetchPlan = async () => {
    const ref = doc(db, "mealPlans", "default");
    const snap = await getDoc(ref);
    setMealPlan(snap.exists() ? snap.data() : {});
  };

  /* ───────── CRUD ───────── */
  const addDish = async (day, type, recipeId) => {
    const current = mealPlan[day]?.[type] || [];
    const updated = {
      ...mealPlan,
      [day]: {
        ...(mealPlan[day] || {}),
        [type]: [...current, recipeId],
      },
    };
    setMealPlan(updated);
    await setDoc(doc(db, "mealPlans", "default"), updated);
  };

  const removeDish = async (day, type, recipeId) => {
    const updated = { ...mealPlan };
    if (updated[day] && Array.isArray(updated[day][type])) {
      updated[day][type] = updated[day][type].filter((id) => id !== recipeId);
      if (updated[day][type].length === 0) delete updated[day][type];
    }
    setMealPlan(updated);
    await setDoc(doc(db, "mealPlans", "default"), updated);
  };
useEffect(() => {
  fetchRecipes();
  fetchPlan();

  const saved = localStorage.getItem("checkedGroceryItems");
  if (saved) {
    setCheckedItems(JSON.parse(saved));
  }
}, []);

  /* ───────── slot UI ───────── */
  const Slot = ({ day, type }) => {
    const raw = mealPlan[day]?.[type];
    const ids = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return (
      <div className="slot">
        {ids.map((id) => {
          const rec = recipes.find((r) => r.id === id);
          if (!rec) return null;
          return (
            <span className="pill" key={id}>
              <span
                style={{
                  marginLeft: "6px",
                  marginTop: "5px",
                  cursor: "pointer",
                }}
                onClick={() => setDetail(rec)}
              >
                {rec.name}
              </span>
              <FaTrash
                style={{ marginLeft: "3px", marginTop: "5px" }}
                onClick={() => removeDish(day, type, id)}
              />
            </span>
          );
        })}
        <span onClick={() => setPopup({ day, type })}>
          <FaCirclePlus
            className="add-icon-btn"
            style={{ marginLeft: "8px" }}
          />
        </span>
      </div>
    );
  };

  /* ───────── popup select ───────── */
 const filtered = search
  ? recipes.filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase())
    )
  : recipes.slice(0, 5);

  const chooseRecipe = (id) => {
    if (!popup.day) return;
    addDish(popup.day, popup.type, id);
    setPopup({ day: null, type: null });
    setSearch("");
  };

  /* ───────── grocery list ───────── */
  const buildGrocery = () => {
    const ids = [];
    Object.values(mealPlan).forEach((d) => {
      Object.values(d).forEach((arr) => ids.push(...arr));
    });
    const items = new Set();
    ids.forEach((id) => {
      const r = recipes.find((x) => x.id === id);
      r?.ingredients?.forEach((i) => items.add(i));
    });
    setGrocery([...items]);
  };

  /* ───────── render ───────── */
  return (
    <div className="planner">
      <h2 style={{ textAlign: "center" }}>Weekly Meal Planner</h2>
      <div className="back" onClick={() => router.push("/")}>
        {" "}
        <FaChevronLeft /> Back to Recipes{" "}
      </div>

      <div className="scroll-wrap">
        <div className="table">
          {/* header */}
          <div className="row head">
            <div className="cell bold">Day</div>
            {mealTypes.map((t) => (
              <div key={t} className="cell bold">
                {t}
              </div>
            ))}
          </div>
          {/* rows */}
          {days.map((day) => (
            <div className="row" key={day}>
              <div className="cell bold">{day}</div>
              {mealTypes.map((type) => (
                <div className="cell" key={type}>
                  <Slot day={day} type={type} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* popup */}
      {popup.day && (
        <div style={{ background: "#fff9e6"}} className="popup">
          <div className="pop-head">
            Pick for {popup.type} – {popup.day}{" "}
            <FaTimes onClick={() => setPopup({ day: null, type: null })} />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
          />
          <ul>
            {filtered.map((r) => (
              <li key={r.id} onClick={() => chooseRecipe(r.id)}>
                {r.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* detail modal */}
      {detail && (
        <div className="detail-modal">
          <div className="detail-card">
            <FaTimes className="close" onClick={() => setDetail(null)} />
            <h3>{detail.name}</h3>
            <p className="muted">{detail.category}</p>
            {/* <h4>Description</h4>
            <p>{detail.description}</p> */}
            <div style={{background:"white",padding:"10px", border:"1px solid #ffd86b" ,borderRadius:"14px"}}>
            <h4>Ingredients</h4>
            <ul>
              {detail.ingredients?.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
            </div>
            <h4>Steps</h4>
            <ol>
              {detail.steps?.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <button className="grocery-btn" onClick={buildGrocery}>
        🧺 Generate Grocery List
      </button>
      {grocery.length > 0 && (
        <div className="grocery-box">
          <h4>Grocery List</h4>
         <ul className="checklist">
  {grocery.map((item, i) => (
    <li key={i}>
      <label>
        <input
          type="checkbox"
          checked={!!checkedItems[item]}
          onChange={(e) => {
            const updated = {
              ...checkedItems,
              [item]: e.target.checked,
            };
            setCheckedItems(updated);
            localStorage.setItem("checkedGroceryItems", JSON.stringify(updated));
          }}
        />
        <span style={{ textDecoration: checkedItems[item] ? "line-through" : "none" }}>
          {item}
        </span>
      </label>
    </li>
  ))}
</ul>

        </div>
      )}

      {/* styles */}
      <style jsx>{`
        .planner {
          padding: 1rem;
          max-width: 1200px;
          margin: auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
        }
        .back {
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 1rem;
        }
        .scroll-wrap {
          overflow-x: auto;
        }
        .add-icon-btn {
          background: transparent;
          border: none;
          padding: 0;
          margin-left: 6px;
          cursor: pointer;
          font-size: 1rem;
          color: #333;
        }

        .table {
          min-width: 750px;
          display: table;
          border-collapse: collapse;
          width: 100%;
        }
        .row {
          display: table-row;
        }
        .cell {
          display: table-cell;
          border: 1px solid #ffd86b;
          padding: 0.55rem;
          background: #fffef3;
          vertical-align: top;
        }
        .head .cell {
          background: #fff4b3;
          font-weight: 600;
        }
        .bold {
          font-weight: 600;
          background: #fff8d1;
        }
        .slot {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
        }
        .pill {
          background: #ffeeb2;
          padding: 0.28rem 0.45rem;
          border-radius: 5px;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.83rem;
        }
        .pill svg {
          cursor: pointer;
        }
        .slot button {
          background: #ffd86b;
          border: none;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          cursor: pointer;
          font-size: 0.82rem;
        }
        /* popup */
        .popup {
          position: fixed;
          top: 15%;
          left: 50%;
          transform: translateX(-50%);
          width: 300px;
          max-height: 70vh;
          background: #fff;
          border: 1px solid #ccc;
          padding: 1rem;
          border-radius: 10px;
          z-index: 200;
          display: flex;
          flex-direction: column;
        }
        .pop-head {
          display: flex;
          justify-content: space-between;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .popup input {
          padding: 0.45rem;
          border: 1px solid #ccc;
          border-radius: 6px;
          margin-bottom: 0.5rem;
        }
        .popup ul {
          margin: 0;
          padding: 0;
          list-style: none;
          overflow-y: auto;
        }
        .checklist {
          list-style: none;
          padding: 0;
          margin-top: 0.5rem;
        }

        .checklist li {
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }

        .checklist input[type="checkbox"] {
          margin-right: 0.6rem;
          transform: scale(1.2);
          accent-color: #ffd86b;
        }

        .popup li {
          padding: 0.4rem;
          border-bottom: 1px solid #eee;
          cursor: pointer;
        }
        .popup li:hover {
          background: #fafafa;
        }
        /* detail modal */
        .detail-modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          justify-content: center;
          align-items: start;
          overflow: auto;
          z-index: 210;
          padding: 2rem 1rem;
        }
        .detail-card {
          background: #fff9e6;
          max-width: 600px;
          width: 100%;
          padding: 1.2rem;
          border-radius: 12px;
          position: relative;
          border: 1px solid #ffd86b;
        }
        .close {
          position: absolute;
          right: 1rem;
          top: 1rem;
          cursor: pointer;
        }
        .muted {
          color: #666;
          margin-top: -0.4rem;
        }
        /* grocery */
        .grocery-btn {
          margin-top: 2rem;
          background: #ffd86b;
          border: none;
          padding: 0.65rem 1.2rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
           color: black;
        }
        .grocery-box {
          background: #fff3d9;
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 10px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
        }
        @media (max-width: 600px) {
          .table {
            min-width: 600px;
          }
          .popup {
            width: 90%;
          }
        }
      `}</style>
    </div>
  );
}
