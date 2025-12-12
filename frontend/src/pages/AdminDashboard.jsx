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

              <button 
                onClick={() => {
                  const newProduct = {
                    type: document.getElementById("type").value,
                    montant: document.getElementById("montant").value,
                    prime: document.getElementById("prime").value,
                    debut: document.getElementById("debut").value,
                    fin: document.getElementById("fin").value,
                  };
                  setProducts([...products, newProduct]);
                  alert("Produit enregistré !");
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        )}


       {activePage === "deploy" && (
          <div className="card_container">
            <div className="card deploy-card">
              <h3>Déployer un produit d'assurance</h3>
              <hr className="title-line" />

              {products.length === 0 ? (
                <p>Aucun produit créé pour le moment.</p>
              ) : (
                <>
                  <label htmlFor="product-select" className="label">Choisir un produit :</label>
                  <select
                    id="product-select"
                    className="full-width"
                    onChange={(e) => {
                      const idx = e.target.value;
                      setSelectedProduct(idx === "" ? null : products[idx]);
                    }}
                    defaultValue=""
                  >
                    <option value="">-- Sélectionner --</option>
                    {products.map((p, index) => (
                      <option key={index} value={index}>
                        {p.type} — {p.montant} / mois  {/* Ici on affiche le montant */}
                      </option>
                    ))}
                  </select>

                  {selectedProduct && (
                    <div className="product-details">
                      <h4 className="detail-title">Description</h4>
                      <p><strong>Type :</strong> {selectedProduct.type}</p>
                      <p><strong>Montant couverture :</strong> {selectedProduct.montant} FCFA</p>
                      <p><strong>Prime mensuelle :</strong> {selectedProduct.prime} FCFA</p>
                      <p><strong>Date début :</strong> {selectedProduct.debut}</p>
                      <p><strong>Date fin :</strong> {selectedProduct.fin}</p>

                      <div className="deploy-actions">
                        <button
                          className="deploy-btn"
                          onClick={() => {
                            alert(`Produit "${selectedProduct.type}" déployé !`);
                          }}
                        >
                          Déployer
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
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
