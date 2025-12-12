import { useState } from "react";
import "./ExpertDashboard.css";
import { Link } from 'react-router-dom';

export default function ExpertDashboard() {
  // Par défaut, "en-attente" est actif
  const [activePage, setActivePage] = useState("en-attente");

  // Exemple de sinistres déclarés
  const [sinistres, setSinistres] = useState([
    {
      id: 1,
      description: "Accident de voiture",
      claimedAmount: 250000,
      proofs: ["photo1.jpg", "rapport.pdf"],
      status: "en-attente",
    },
    {
      id: 2,
      description: "Dégât des eaux",
      claimedAmount: 150000,
      proofs: ["photo2.jpg"],
      status: "en-attente",
    },
    {
      id: 3,
      description: "incendie",
      claimedAmount: 150000,
      proofs: ["photo2.jpg"],
      status: "en-attente",
    },
  ]);

  // Gestion de la validation ou du rejet
  const handleDecision = (id, decision) => {
    setSinistres((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: decision } : s
      )
    );
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

        <h3 className="sidebar-title">Liste des sinistres</h3>
        <ul className="sinister-status-list">
          <li
            className={activePage === "en-attente" ? "active" : ""}
            onClick={() => setActivePage("en-attente")}
          >
            <span className="bullet bullet-orange"></span> En attente
          </li>
          <li
            className={activePage === "rejete" ? "active" : ""}
            onClick={() => setActivePage("rejete")}
          >
            <span className="bullet bullet-red"></span> Rejeté
          </li>
          <li
            className={activePage === "valide" ? "active" : ""}
            onClick={() => setActivePage("valide")}
          >
            <span className="bullet bullet-green"></span> Validé / indemnisé
          </li>
        </ul>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="main">
        <div className="header">
          <h2>Dashboard Expert</h2>
          <Link to="/login" className="link-home">Accueil</Link>
        </div>

        {/* --- SINISTRES --- */}
        {activePage === "en-attente" && (
          <div className="card_container">
            {sinistres
              .filter((s) => s.status === "en-attente")
              .map((sinistre) => (
                <div key={sinistre.id} className="card sinister-card">
                  <h3>{sinistre.description}</h3>
                  <hr className="title-line" />
                  <p><strong>Montant réclamé :</strong> {sinistre.claimedAmount.toLocaleString()} FCFA</p>
                  <p><strong>Preuves :</strong></p>
                  <div className="proofs-container">
                    {sinistre.proofs.map((file, index) => (
                        <span key={index} className="proof-item">{file}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <button onClick={() => handleDecision(sinistre.id, "valide")}>Valider</button>
                    <button onClick={() => handleDecision(sinistre.id, "rejete")}>Rejeter</button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {activePage === "rejete" && (
          <div className="card_container">
            {sinistres
              .filter((s) => s.status === "rejete")
              .map((sinistre) => (
                <div key={sinistre.id} className="card sinister-card">
                  <h3>{sinistre.description}</h3>
                  <p>Montant réclamé : {sinistre.claimedAmount.toLocaleString()} FCFA</p>
                  <p>Status : Rejeté</p>
                </div>
              ))}
          </div>
        )}

        {activePage === "valide" && (
          <div className="card_container">
            {sinistres
              .filter((s) => s.status === "valide")
              .map((sinistre) => (
                <div key={sinistre.id} className="card sinister-card">
                  <h3>{sinistre.description}</h3>
                  <p>Montant réclamé : {sinistre.claimedAmount.toLocaleString()} FCFA</p>
                  <p>Status : Validé / indemnisé</p>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
