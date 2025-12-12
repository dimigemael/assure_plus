
import React, { useState } from 'react';
import './Register.css';
import eye from "../assets/eye.svg";
import eyeSlash from "../assets/eye-slash.svg";
import { useNavigate } from "react-router-dom"; 

const Register = () => {

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    confirmMotDePasse: '',
    role: 'Assuré',
    walletAddress: '',
    specialite: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate(); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  {/* VALIDATION */}
  const handleSubmit = (e) => {
    e.preventDefault();

    const { motDePasse, confirmMotDePasse } = formData;

    if (motDePasse.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (!/[0-9]/.test(motDePasse)) {
      setError("Le mot de passe doit contenir au moins un chiffre.");
      return;
    }

    if (motDePasse !== confirmMotDePasse) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setError("");
    console.log("Formulaire valide :", formData);
  };

  return (
    <div className="register-page">
      <h1 className="logo">Assura+</h1>

      <div className="register-container">
        <header className="register-header">
          <h2 className="title">Créer un compte</h2>
          <p className="subtitle">C'est facile et rapide.</p>
        </header>

        <form className="register-form" onSubmit={handleSubmit}>

          <div className="form-group">
            <input type="text" name="nom" value={formData.nom} onChange={handleChange} placeholder="Nom" required/>
          </div>

          <div className="form-group">
            <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} placeholder="Prenom" required />
          </div>

          <div className="form-group">
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Adresse e-mail" required />
          </div>

          {/* MOT DE PASSE */}
          <div className="form-group password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="motDePasse"
              value={formData.motDePasse}
              onChange={handleChange}
              placeholder="Nouveau mot de passe"
              required
            />

            {formData.motDePasse !== "" && (
              <img
                src={showPassword ? eye : eyeSlash}
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
                alt="Afficher"
              />
            )}
          </div>

          {/* CONFIRMATION MOT DE PASSE */}
          <div className="form-group password-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmMotDePasse"
              value={formData.confirmMotDePasse}
              onChange={handleChange}
              placeholder="Confirmer le mot de passe"
              required
            />

            {formData.confirmMotDePasse !== "" && (
              <img
                src={showConfirmPassword ? eye : eyeSlash}
                className="eye-icon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                alt="Afficher"
              />
            )}
          </div>

          {/* MESSAGE D’ERREUR */}
          {error && <p className="error-text">{error}</p>}

          {/* ROLE */}
          <div className="form-group role-group">
            <label className="role-label">Role</label>

            <div className="role-options">
              <label className={`radio-card ${formData.role === 'Assuré' ? 'selected' : ''}`}>
                <input type="radio" name="role" value="Assuré" checked={formData.role === 'Assuré'} onChange={handleChange} />
                Assuré
              </label>

              <label className={`radio-card ${formData.role === 'Expert' ? 'selected' : ''}`}>
                <input type="radio" name="role" value="Expert" checked={formData.role === 'Expert'} onChange={handleChange} />
                Expert
              </label>
            </div>
          </div>

          {formData.role === 'Assuré' && (
            <div className="form-group">
              <input type="text" name="walletAddress" value={formData.walletAddress} onChange={handleChange} placeholder="Wallet Address" required />
            </div>
          )}

          {formData.role === 'Expert' && (
            <div className="form-group">
              <input type="text" name="specialite" value={formData.specialite} onChange={handleChange} placeholder="Spécialité" required />
            </div>
          )}

          <button type="submit" className="submit-button">S'inscrire</button>

          <div className="login-link-container " onClick={() => navigate("/")}>
            <p className="login-link">Vous avez déjà un compte ?</p>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Register;
