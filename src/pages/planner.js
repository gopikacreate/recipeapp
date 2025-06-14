// pages/planner.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../lib/firebase';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';

const days   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const meals  = ['Breakfast','Lunch','Dinner','Snack'];

export default function Planner() {
  const [plan,setPlan] = useState({});
  const [weekId] = useState(getWeekId());

  useEffect(()=>{ load(); },[]);
  const load = async () => {
    const snap = await getDoc(doc(db,'mealPlans',weekId));
    setPlan(snap.exists()? snap.data() : {});
  };

  const write = async (d,m,recipeId) => {
    const ref = doc(db,'mealPlans',weekId);
    await setDoc(ref,{ 
      ...plan,
      [d]: { ...(plan[d]||{}), [m]: recipeId }
    });
    load();
  };

  return (
    <div style={{padding:'1rem'}}>
      <h2>Meal Plan {weekId}</h2>
      <table className="grid">
        <thead>
          <tr><th></th>{days.map(d=><th key={d}>{d}</th>)}</tr>
        </thead>
        <tbody>
          {meals.map(meal=>(
            <tr key={meal}>
              <td className="meal">{meal}</td>
              {days.map(d=>{
                const rId = plan[d]?.[meal];
                return (
                  <td key={d} onClick={()=>promptPick(d,meal,rId)}>
                    {rId ? <Link href={`/#${rId}`}>{rId}</Link> : '➕'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .grid { border-collapse: collapse; width:100%; }
        th,td { border:1px solid #ddd; padding:.4rem; text-align:center; }
        td { cursor:pointer; }
        .meal { font-weight:600; width:7rem; }
      `}</style>
    </div>
  );

  /* ---- minimal modal via prompt ---- */
  async function promptPick(day,meal,oldId){
    const val = prompt(`Enter recipe ID for ${meal} on ${day}`, oldId||'');
    if (val!==null) write(day,meal,val.trim()||null);
  }
}

function getWeekId(d=new Date()){
  const w = 1+Math.floor(
    (d - new Date(d.getFullYear(),0,1))/ (7*24*60*60*1000)
  );
  return `${d.getFullYear()}-W${String(w).padStart(2,'0')}`;
}
