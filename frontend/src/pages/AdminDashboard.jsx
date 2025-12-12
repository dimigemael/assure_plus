import { useState } from "react";
import "./AdminDashboard.css"; 
import "./Login.jsx"
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("create");
  //simulation
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  return (
    <div className="dashboard-container">

      {/* --- SIDEBAR --- */}
      <div className="sidebar">

        <div className="profile">
          <div className="avatar">👤</div>
          <h3>FOLLA BELL</h3>
          <p>follabell@gmail.com</p>
        </div>

        <ul className="menu">
          <li 
            className={activePage === "create" ? "active" : ""}
            onClick={() => setActivePage("create")}
          >
            Créer un produit d'assurance
          </li>

          <li 
            className={activePage === "deploy" ? "active" : ""}
            onClick={() => setActivePage("deploy")}
          >
            Déployer un produit crée
          </li>

          <li 
            className={activePage === "list" ? "active" : ""}
            onClick={() => setActivePage("list")}
          >
            Liste des assurés + contrats
          </li>

          <li 
            className={activePage === "stats" ? "active" : ""}
            onClick={() => setActivePage("stats")}
          >
            Statistiques globales
          </li>
        </ul>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="main">
        <div className="header">
          <h2>Dashboard Admin/Assureur</h2>
          <Link to="/login" className="link-home">Accueil</Link>
        </div>

        {/* --- PAGE CONTENT --- */}
        

        {activePage === "create" && (
          <div className="card_container">
            <div className="card">

              <h3>Créer un produit d’assurance</h3>
              <hr className="title-line" />

              <input id="type" type="text" placeholder="Type d’assurance" required />
              <input id="montant" type="number" placeholder="Montant couverture" required />
              <input id="prime" type="number" placeholder="Prime mensuelle" required />

              <label>Date début</label>
              <input id="debut" type="date" required />

              <label>Date fin</label>
              <input id="fin" type="date" required />

              <button>
                Enregistrer
              </button>
            </div>
          </div>
        )}


       {activePage === "deploy" && (
          <div className="card">
              <h3>Liste des produits crees</h3>
              <p>Ici tu affiches un tableau ou une liste.</p>
          </div>
            
        )}

        {activePage === "list" && (
          <div className="card">
            <h3>Liste des assurés + contrats</h3>
            <p>Ici tu affiches un tableau ou une liste.</p>
          </div>
        )}

        {activePage === "stats" && (
          <div className="card">
            <h3>Statistiques globales</h3>
            <p>Graphiques, chiffres, etc.</p>
          </div>
        )}
      </div>
    </div>
    
  );
}
