import { useState } from "react";
import "./AssureDashboard.css"; 
import { Link } from 'react-router-dom';
import cloud from "../assets/cloud.svg";

export default function AssureDashboard() {
  const [activePage, setActivePage] = useState("suscribe");

  // Simuler des produits disponibles
  const [products] = useState([
    {
      type: "Assurance Vie",
      montant: 500000,
      prime: 5000,
      debut: "2025-01-01",
      fin: "2025-12-31"
    },
    {
      type: "Assurance Auto",
      montant: 1000000,
      prime: 10000,
      debut: "2025-03-01",
      fin: "2026-02-28"
    },
    {
      type: "Assurance Santé",
      montant: 750000,
      prime: 7000,
      debut: "2025-05-01",
      fin: "2026-04-30"
    }
  ]);

  // --- NOUVEAUX ÉTATS POUR LE FORMULAIRE DE SINISTRE ---
  const [sinisterDetails, setSinisterDetails] = useState({
    description: '',
    claimedAmount: '',
    proofs: null, // pour le fichier
  });

  const handleSinisterChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'proofs') {
        setSinisterDetails({ ...sinisterDetails, [name]: files[0] });
    } else {
        setSinisterDetails({ ...sinisterDetails, [name]: value });
    }
  };

  const handleSinisterSubmit = (e) => {
    e.preventDefault();
    // Ici, vous ajouteriez la logique de soumission à une API
    console.log("Sinistre à déclarer :", sinisterDetails);
    alert(`Déclaration de sinistre reçue : ${sinisterDetails.description}. Montant réclamé : ${sinisterDetails.claimedAmount} FCFA. Preuve(s) : ${sinisterDetails.proofs ? sinisterDetails.proofs.name : 'Aucune'}`);
    
    // Réinitialiser le formulaire
    setSinisterDetails({ description: '', claimedAmount: '', proofs: null });
  };

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
            className={activePage === "suscribe" ? "active" : ""}
            onClick={() => setActivePage("suscribe")}
          >
           Consulter/souscrire à un produit d'assurance
          </li>

          <li 
            className={activePage === "declare" ? "active" : ""}
            onClick={() => setActivePage("declare")}
          >
            Déclarer un sinistre
          </li>

          <li 
            className={activePage === "list" ? "active" : ""}
            onClick={() => setActivePage("list")}
          >
           Historique des  contrats et transactions
          </li>
        </ul>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="main">
        <div className="header">
          <h2>Dashboard Assuré</h2>
          <Link to="/login" className="link-home">Accueil</Link>
        </div>

        {/* --- PAGE CONTENT --- */}
        {activePage === "suscribe" && (
          <div className="card_container">
            {products.map((product, index) => (
              <div key={index} className="card">
                <h3>{product.type}</h3>
                <hr className="title-line" />

                <p><strong>Montant couverture :</strong> {product.montant.toLocaleString()} FCFA</p>
                <p><strong>Prime mensuelle :</strong> {product.prime.toLocaleString()} FCFA</p>
                <p><strong>Date début :</strong> {product.debut}</p>
                <p><strong>Date fin :</strong> {product.fin}</p>

                <button
                  onClick={() => alert(`Vous avez souscrit au produit "${product.type}" !`)}
                >
                  Souscrire
                </button>
              </div>
            ))}
          </div>
        )}

        {/* --- DÉCLARER UN SINISTRE --- */}
        {activePage === "declare" && (
          <div className="card_container">
            <div className="card sinister-card">
              <h3 className="sinister-title">Déclarer un sinistre</h3>
               <hr className="title-line2" />

              
              <form onSubmit={handleSinisterSubmit}>
                
                {/* Champ Description (Textearea pour une meilleure apparence) */}
                <div className="input-group">
                  <textarea 
                    name="description" 
                    placeholder="Description" 
                    rows="3"
                    value={sinisterDetails.description}
                    onChange={handleSinisterChange}
                    required 
                  />
                </div>

                {/* Champ Montant réclamé */}
                <div className="input-group">
                  <input 
                    name="claimedAmount" 
                    type="number" 
                    placeholder="Montant réclamé" 
                    value={sinisterDetails.claimedAmount}
                    onChange={handleSinisterChange}
                    required 
                  />
                </div>
                
                {/* Zone de Téléversement de Preuves */}
                <label className="proofs-label">Téléverser des preuves</label>
                <div 
                  className="file-upload-zone"
                  onClick={() => document.getElementById('proofs-input').click()} 
                >
                  <input 
                    name="proofs"
                    type="file" 
                    id="proofs-input" 
                    onChange={handleSinisterChange}
                    style={{ display: 'none' }} 
                    multiple 
                  />
                  
                  {/* Affichage visuel des nuages ou du nom du fichier sélectionné */}
                  {sinisterDetails.proofs ? (
                      <p className="file-name">{sinisterDetails.proofs.name}</p>
                  ) : (
                      <div className="cloud-icon-container">
                        <img 
                            src={cloud}
                            alt="Nuage icône 1" 
                            className="cloud-image primary-cloud" 
                        />
                        <div className="cloud-icon-line">
                            <img 
                                src={cloud}
                                alt="Nuage icône 1" 
                                className="cloud-image primary-cloud" 
                            />

                            <img 
                                src={cloud} 
                                alt="Nuage icône 1" 
                                className="cloud-image primary-cloud" 
                            />
                        </div>

                      </div>
                  )}
                </div>

                {/* Bouton Envoyer */}
                <button type="submit" className="sinister-submit-btn">
                  Envoyer
                </button>
              </form>
            </div>
          </div>
        )}

        {activePage === "list" && (
          <div className="card">
            <h3>Historique des  contrats et transactions</h3>
          </div>
        )}
      </div>
    </div>
  );
}
