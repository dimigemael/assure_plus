import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const SubscriptionForm = ({ product, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    date_debut: '',
    date_fin: '',
    beneficiaire_nom: '',
    beneficiaire_relation: '',
  });

  const [bienAssure, setBienAssure] = useState({});

  // Initialiser les champs du bien assuré selon le type d'assurance
  const initializeBienAssure = (typeAssurance) => {
    switch (typeAssurance) {
      case 'Auto':
        return { marque: '', modele: '', immatriculation: '', annee: '' };
      case 'Habitation':
        return { adresse: '', superficie: '', type_logement: '', nombre_pieces: '' };
      case 'Santé':
        return { regime_social: '', numero_securite_sociale: '' };
      case 'Vie':
        return { capital_garanti: '', duree_contrat: '' };
      default:
        return { description: '' };
    }
  };

  // Initialiser au montage
  useEffect(() => {
    setBienAssure(initializeBienAssure(product.type_assurance));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.type_assurance]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBienAssureChange = (field, value) => {
    setBienAssure(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const subscriptionData = {
      insurance_product_id: product.id,
      ...formData,
      bien_assure: Object.keys(bienAssure).length > 0 ? bienAssure : null,
    };

    onSubmit(subscriptionData);
  };

  return (
    <div className="card">
      <h3>Souscrire à {product.nom_produit}</h3>
      <hr className="title-line" />

      <div style={{ backgroundColor: '#f0f7ff', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ margin: '5px 0', fontSize: '1.3rem' }}>
          <strong>Type :</strong> {product.type_assurance}
        </p>
        <p style={{ margin: '5px 0', fontSize: '1.3rem' }}>
          <strong>Couverture :</strong> {parseFloat(product.montant_couverture_base).toLocaleString()} €
        </p>
        <p style={{ margin: '5px 0', fontSize: '1.3rem' }}>
          <strong>Prime {product.frequence_paiement} :</strong> {parseFloat(product.prime_base).toLocaleString()} €
        </p>
        <p style={{ margin: '5px 0', fontSize: '1.3rem' }}>
          <strong>Franchise :</strong> {parseFloat(product.franchise_base).toLocaleString()} €
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Champs dynamiques selon le type d'assurance */}
        {product.type_assurance === 'Auto' && (
          <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '10px', fontSize: '1.5rem' }}>Informations du véhicule</h4>
            <label>Marque *</label>
            <input
              type="text"
              value={bienAssure.marque || ''}
              onChange={(e) => handleBienAssureChange('marque', e.target.value)}
              placeholder="Ex: Toyota"
              required
            />
            <label>Modèle *</label>
            <input
              type="text"
              value={bienAssure.modele || ''}
              onChange={(e) => handleBienAssureChange('modele', e.target.value)}
              placeholder="Ex: Corolla"
              required
            />
            <label>Immatriculation *</label>
            <input
              type="text"
              value={bienAssure.immatriculation || ''}
              onChange={(e) => handleBienAssureChange('immatriculation', e.target.value)}
              placeholder="Ex: AB-123-CD"
              required
            />
            <label>Année *</label>
            <input
              type="number"
              value={bienAssure.annee || ''}
              onChange={(e) => handleBienAssureChange('annee', e.target.value)}
              placeholder="Ex: 2020"
              min="1900"
              max={new Date().getFullYear() + 1}
              required
            />
          </div>
        )}

        {product.type_assurance === 'Habitation' && (
          <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '10px', fontSize: '1.5rem' }}>Informations du logement</h4>
            <label>Adresse complète *</label>
            <input
              type="text"
              value={bienAssure.adresse || ''}
              onChange={(e) => handleBienAssureChange('adresse', e.target.value)}
              placeholder="Ex: 123 Rue de la Paix, Paris"
              required
            />
            <label>Type de logement *</label>
            <select
              value={bienAssure.type_logement || ''}
              onChange={(e) => handleBienAssureChange('type_logement', e.target.value)}
              required
            >
              <option value="">-- Sélectionner --</option>
              <option value="Appartement">Appartement</option>
              <option value="Maison">Maison</option>
              <option value="Studio">Studio</option>
              <option value="Villa">Villa</option>
            </select>
            <label>Superficie (m²) *</label>
            <input
              type="number"
              value={bienAssure.superficie || ''}
              onChange={(e) => handleBienAssureChange('superficie', e.target.value)}
              placeholder="Ex: 75"
              required
            />
            <label>Nombre de pièces *</label>
            <input
              type="number"
              value={bienAssure.nombre_pieces || ''}
              onChange={(e) => handleBienAssureChange('nombre_pieces', e.target.value)}
              placeholder="Ex: 3"
              min="1"
              required
            />
          </div>
        )}

        {product.type_assurance === 'Santé' && (
          <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '10px', fontSize: '1.5rem' }}>Informations santé</h4>
            <label>Régime social</label>
            <select
              value={bienAssure.regime_social || ''}
              onChange={(e) => handleBienAssureChange('regime_social', e.target.value)}
            >
              <option value="">-- Sélectionner --</option>
              <option value="Sécurité Sociale">Sécurité Sociale</option>
              <option value="MSA">MSA</option>
              <option value="RSI">RSI</option>
              <option value="Autre">Autre</option>
            </select>
            <label>Numéro de sécurité sociale</label>
            <input
              type="text"
              value={bienAssure.numero_securite_sociale || ''}
              onChange={(e) => handleBienAssureChange('numero_securite_sociale', e.target.value)}
              placeholder="Ex: 1 89 05 49 588 157 80"
            />
          </div>
        )}

        {product.type_assurance === 'Vie' && (
          <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '10px', fontSize: '1.5rem' }}>Informations assurance vie</h4>
            <label>Capital garanti (€)</label>
            <input
              type="number"
              value={bienAssure.capital_garanti || ''}
              onChange={(e) => handleBienAssureChange('capital_garanti', e.target.value)}
              placeholder="Ex: 100000"
            />
            <label>Durée du contrat (années)</label>
            <input
              type="number"
              value={bienAssure.duree_contrat || ''}
              onChange={(e) => handleBienAssureChange('duree_contrat', e.target.value)}
              placeholder="Ex: 20"
              min="1"
            />
          </div>
        )}

        {product.type_assurance && !['Auto', 'Habitation', 'Santé', 'Vie'].includes(product.type_assurance) && (
          <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '10px', fontSize: '1.5rem' }}>Description du bien assuré</h4>
            <label>Description</label>
            <textarea
              value={bienAssure.description || ''}
              onChange={(e) => handleBienAssureChange('description', e.target.value)}
              placeholder="Décrivez le bien ou service assuré..."
              rows="4"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
        )}

        {/* Dates */}
        <label>Date de début *</label>
        <input
          name="date_debut"
          type="date"
          value={formData.date_debut}
          onChange={handleInputChange}
          min={new Date().toISOString().split('T')[0]}
          required
        />

        <label>Date de fin *</label>
        <input
          name="date_fin"
          type="date"
          value={formData.date_fin}
          onChange={handleInputChange}
          min={formData.date_debut || new Date().toISOString().split('T')[0]}
          required
        />

        {/* Bénéficiaire */}
        <label>Bénéficiaire (optionnel)</label>
        <input
          name="beneficiaire_nom"
          type="text"
          value={formData.beneficiaire_nom}
          onChange={handleInputChange}
          placeholder="Nom du bénéficiaire"
        />

        <input
          name="beneficiaire_relation"
          type="text"
          value={formData.beneficiaire_relation}
          onChange={handleInputChange}
          placeholder="Relation (conjoint, enfant...)"
        />

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="submit" style={{ flex: 1 }}>
            Valider la souscription
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              backgroundColor: '#666',
              cursor: 'pointer'
            }}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

SubscriptionForm.propTypes = {
  product: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default SubscriptionForm;
