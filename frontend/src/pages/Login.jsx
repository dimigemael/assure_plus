import { useState } from "react";
import "./Login.css";
import eye from "../assets/eye.svg"; // œil ouvert
import eyeSlash from "../assets/eye-slash.svg"; // œil barré
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(email, password);

      // Redirection selon le rôle de l'utilisateur
      switch (response.user.role) {
        case 'admin':
          navigate("/admin_dashboard");
          break;
        case 'expert':
          navigate("/expert_dashboard");
          break;
        case 'assure':
          navigate("/assure_dashboard");
          break;
        default:
          navigate("/");
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">

      {/* TEXTE */}
      <div className="login-left">
        <h1>Assura+</h1>
        <p>Avec Assura+, gérez vos assurances simplement.</p>
      </div>

      {/* FORMULAIRE */}
      <div className="login-box">

        {error && (
          <div style={{
            color: '#d32f2f',
            backgroundColor: '#ffebee',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        {/* CHAMP PASSWORD AVEC ŒIL */}
        <div className="password-wrapper">

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          {password !== "" && (
            <img
              src={showPassword ? eye: eyeSlash }
              alt="Afficher le mot de passe"
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            />
          )}

        </div>

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading || !email || !password}
        >
          {loading ? "Connexion en cours..." : "Se connecter"}
        </button>

        <p className="forgot"><a href="#">Mot de passe oublié ?</a></p>

        <hr className="divider" />

        
        {/* REDIRECTION VERS REGISTER */}
        <button 
          className="btn-secondary"
          onClick={() => navigate("/register")}>
          Créer un nouveau compte
        </button>

      </div>

    </div>
  );
}

export default Login;
