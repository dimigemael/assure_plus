import { useState } from "react";
import "./Login.css";
import eye from "../assets/eye.svg"; // œil ouvert
import eyeSlash from "../assets/eye-slash.svg"; // œil barré
import { useNavigate } from "react-router-dom"; 

function Login() {

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();  

  return (
    <div className="login-container">

      {/* TEXTE */}
      <div className="login-left">
        <h1>Assura+</h1>
        <p>Avec Assura+, gérez vos assurances simplement.</p>
      </div>

      {/* FORMULAIRE */}
      <div className="login-box">

        <input type="email" placeholder="Adresse e-mail" />

        {/* CHAMP PASSWORD AVEC ŒIL */}
        <div className="password-wrapper">

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        <button className="btn-primary" onClick={() => navigate("/expert_dashboard")}>Se connecter</button>

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
