
import { useState } from 'react';
import './Register.css';
import eye from "../assets/eye.svg";
import eyeSlash from "../assets/eye-slash.svg";
import { useNavigate } from "react-router-dom";
import WalletConnect from '../components/WalletConnect';
import authService from '../services/authService'; 

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
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate(); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  {/* VALIDATION */}
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { motDePasse, confirmMotDePasse, role, walletAddress, specialite } = formData;

    // Validation mot de passe
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

    // Validation wallet pour assuré
    if (role === 'Assuré' && !walletAddress) {
      setError("Veuillez connecter votre wallet MetaMask.");
      return;
    }

    // Validation spécialité pour expert
    if (role === 'Expert' && !specialite) {
      setError("Veuillez renseigner votre spécialité.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Préparer les données pour l'API
      // Normaliser le rôle : retirer les accents (Assuré -> assure, Expert -> expert)
      const normalizedRole = role
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Retire les accents

      const registrationData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        password: motDePasse,
        password_confirmation: confirmMotDePasse,
        role: normalizedRole,
      };

      // Ajouter wallet_address si assuré
      if (role === 'Assuré') {
        registrationData.wallet_address = walletAddress;
      }

      // Ajouter specialite si expert
      if (role === 'Expert') {
        registrationData.specialite = specialite;
      }

      await authService.register(registrationData);

      setSuccessMessage("Inscription réussie ! Redirection vers la page de connexion...");

      // Redirection après 2 secondes
      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (err) {
      console.error('Erreur inscription:', err);
      setError(err || "Une erreur s'est produite lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
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
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
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

          {/* MESSAGE D'ERREUR */}
          {error && <p className="error-text">{error}</p>}

          {/* MESSAGE DE SUCCÈS */}
          {successMessage && (
            <p style={{
              padding: '10px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '4px',
              fontSize: '14px',
              marginBottom: '10px'
            }}>
              {successMessage}
            </p>
          )}

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
              <WalletConnect
                onConnect={(address) => {
                  setFormData(prev => ({
                    ...prev,
                    walletAddress: address
                  }));
                }}
                showBalance={false}
              />
              {formData.walletAddress && (
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Wallet connecté : {formData.walletAddress.substring(0, 6)}...{formData.walletAddress.substring(formData.walletAddress.length - 4)}
                </p>
              )}
            </div>
          )}

          {formData.role === 'Expert' && (
            <div className="form-group">
              <input type="text" name="specialite" value={formData.specialite} onChange={handleChange} placeholder="Spécialité" required />
            </div>
          )}

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
          </button>

          <div className="login-link-container " onClick={() => navigate("/")}>
            <p className="login-link">Vous avez déjà un compte ?</p>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Register;
