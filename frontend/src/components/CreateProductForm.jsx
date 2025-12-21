import { useState } from 'react';
import PropTypes from 'prop-types';
import productService from '../services/productService';

const CreateProductForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    nom_produit: '',
    type_assurance: '',
    description: '',
    montant_couverture_base: '',
    prime_base: '',
    franchise_base: '0',
    frequence_paiement: 'mensuelle',
  });

  const [garanties, setGaranties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Charger les garanties suggérées si on change le type d'assurance
    if (name === 'type_assurance') {
      const suggestedGaranties = productService.getGarantiesParType(value);
      setGaranties(suggestedGaranties.map(g => ({ ...g, selected: g.obligatoire })));
    }
  };

  const handleGarantieToggle = (index) => {
    const newGaranties = [...garanties];
    if (!newGaranties[index].obligatoire) {
      newGaranties[index].selected = !newGaranties[index].selected;
      setGaranties(newGaranties);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const selectedGaranties = garanties
        .filter(g => g.selected || g.obligatoire)
        .map(g => ({
          nom: g.nom,
          obligatoire: g.obligatoire,
        }));

      const productData = {
        ...formData,
        garanties_incluses: selectedGaranties,
      };

      await productService.create(productData);
      setSuccess('Produit créé avec succès !');

      // Réinitialiser le formulaire
      setFormData({
        nom_produit: '',
        type_assurance: '',
        description: '',
        montant_couverture_base: '',
        prime_base: '',
        franchise_base: '0',
        frequence_paiement: 'mensuelle',
      });
      setGaranties([]);

      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      setError(typeof err === 'string' ? err : 'Erreur lors de la création du produit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>Créer un produit d'assurance</h3>
      <hr className="title-line" />

      {error && (
        <div style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ color: '#2e7d32', backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Nom du produit */}
        <div>
          <label>Nom du produit *</label>
          <input
            name="nom_produit"
            type="text"
            value={formData.nom_produit}
            onChange={handleInputChange}
            placeholder="Ex: Auto Premium"
            required
          />
        </div>

        {/* Type d'assurance */}
        <div>
          <label>Type d'assurance *</label>
          <select
            name="type_assurance"
            value={formData.type_assurance}
            onChange={handleInputChange}
            required
          >
            <option value="">-- Sélectionner --</option>
            {productService.getTypesAssurance().map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Description détaillée du produit..."
            rows="3"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        {/* Montant couverture */}
        <div>
          <label>Montant de couverture de base (XAF) *</label>
          <input
            name="montant_couverture_base"
            type="number"
            value={formData.montant_couverture_base}
            onChange={handleInputChange}
            placeholder="Ex: 50000"
            required
          />
        </div>

        {/* Prime */}
        <div>
          <label>
            Prime de base (XAF) *
            <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginLeft: '8px' }}>
              (Montant à payer selon la fréquence)
            </span>
          </label>
          <input
            name="prime_base"
            type="number"
            value={formData.prime_base}
            onChange={handleInputChange}
            placeholder="Ex: 150"
            required
          />
        </div>

        {/* Fréquence de paiement */}
        <div>
          <label>Fréquence de paiement *</label>
          <select
            name="frequence_paiement"
            value={formData.frequence_paiement}
            onChange={handleInputChange}
            required
          >
            {productService.getFrequencesPaiement().map(freq => (
              <option key={freq.value} value={freq.value}>{freq.label}</option>
            ))}
          </select>
        </div>

        {/* Franchise */}
        <div>
          <label>
            Franchise de base (XAF)
            <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginLeft: '8px' }}>
              (Montant restant à charge en cas de sinistre)
            </span>
          </label>
          <input
            name="franchise_base"
            type="number"
            value={formData.franchise_base}
            onChange={handleInputChange}
            placeholder="Ex: 500"
          />
        </div>

        {/* Garanties */}
        {garanties.length > 0 && (
          <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
            <label>Garanties incluses</label>
            {garanties.map((garantie, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={garantie.selected || garantie.obligatoire}
                  onChange={() => handleGarantieToggle(index)}
                  disabled={garantie.obligatoire}
                  style={{ marginRight: '8px' }}
                />
                <span>
                  {garantie.nom} {garantie.obligatoire && <strong>(Obligatoire)</strong>}
                </span>
              </div>
            ))}
          </div>
        )}

        <button type="submit" disabled={loading} style={{ gridColumn: '1 / -1' }}>
          {loading ? 'Création en cours...' : 'Créer le produit'}
        </button>
      </form>
    </div>
  );
};

CreateProductForm.propTypes = {
  onSuccess: PropTypes.func,
};

export default CreateProductForm;
