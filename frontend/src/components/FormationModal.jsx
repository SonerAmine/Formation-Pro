import React, { useState, useCallback } from 'react';
import Button from './Button';
import FormInput from './FormInput';
import '../styles/FormationModal.css';

const FormationModal = ({ isOpen, onClose, onSubmit, loading, editData = null, isEditing = false }) => {
  const getInitialFormData = useCallback(() => {
    if (isEditing && editData) {
      return {
        titre: editData.titre || '',
        description: editData.description || '',
        descriptionComplete: editData.descriptionComplete || '',
        prix: editData.prix?.toString() || '',
        duree: editData.duree?.toString() || '',
        placesTotales: editData.placesTotales?.toString() || '',
        dateDebut: editData.dateDebut ? new Date(editData.dateDebut).toISOString().slice(0, 16) : '',
        dateFin: editData.dateFin ? new Date(editData.dateFin).toISOString().slice(0, 16) : '',
        categorie: editData.categorie || 'tech',
        niveau: editData.niveau || 'debutant',
        mode: editData.mode || 'presentiel',
        statut: editData.statut || 'publiee',
        prerequis: editData.prerequis?.length ? editData.prerequis : [''],
        objectifs: editData.objectifs?.length ? editData.objectifs : [''],
        programme: editData.programme?.length ? editData.programme : [{ titre: '', description: '', duree: '' }],
        formateur: {
          nom: editData.formateur?.nom || '',
          bio: editData.formateur?.bio || '',
          expertise: editData.formateur?.expertise?.length ? editData.formateur.expertise : ['']
        },
        lieu: {
          adresse: editData.lieu?.adresse || '',
          ville: editData.lieu?.ville || '',
          codePostal: editData.lieu?.codePostal || '',
          salle: editData.lieu?.salle || ''
        },
        lienVisio: editData.lienVisio || '',
        materiel: editData.materiel?.length ? editData.materiel : [''],
        certification: {
          disponible: editData.certification?.disponible || false,
          nom: editData.certification?.nom || '',
          organisme: editData.certification?.organisme || ''
        },
        tags: editData.tags?.length ? editData.tags : ['']
      };
    }
    
    return {
      titre: '',
      description: '',
      descriptionComplete: '',
      prix: '',
      duree: '',
      placesTotales: '',
      dateDebut: '',
      dateFin: '',
      categorie: 'tech',
      niveau: 'debutant',
      mode: 'presentiel',
      statut: 'publiee',
      prerequis: [''],
      objectifs: [''],
      programme: [{ titre: '', description: '', duree: '' }],
      formateur: { nom: '', bio: '', expertise: [''] },
      lieu: { adresse: '', ville: '', codePostal: '', salle: '' },
      lienVisio: '',
      materiel: [''],
      certification: { disponible: false, nom: '', organisme: '' },
      tags: ['']
    };
  }, [isEditing, editData]);

  const [formData, setFormData] = useState(getInitialFormData());

  const [errors, setErrors] = useState({});

  const categories = [
    { value: 'tech', label: 'Technologies' },
    { value: 'business', label: 'Business' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'management', label: 'Management' },
    { value: 'autres', label: 'Autres' }
  ];

  const niveaux = [
    { value: 'debutant', label: 'Débutant' },
    { value: 'intermediaire', label: 'Intermédiaire' },
    { value: 'avance', label: 'Avancé' }
  ];

  const modes = [
    { value: 'presentiel', label: 'Présentiel' },
    { value: 'distanciel', label: 'Distanciel' },
    { value: 'hybride', label: 'Hybride' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleArrayChange = (arrayName, index, value) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayItem = (arrayName, defaultValue = '') => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], defaultValue]
    }));
  };

  const removeArrayItem = (arrayName, index) => {
    if (formData[arrayName].length > 1) {
      setFormData(prev => ({
        ...prev,
        [arrayName]: prev[arrayName].filter((_, i) => i !== index)
      }));
    }
  };

  const handleProgrammeChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      programme: prev.programme.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addProgrammeItem = () => {
    setFormData(prev => ({
      ...prev,
      programme: [...prev.programme, { titre: '', description: '', duree: '' }]
    }));
  };

  const removeProgrammeItem = (index) => {
    if (formData.programme.length > 1) {
      setFormData(prev => ({
        ...prev,
        programme: prev.programme.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Champs requis
    if (!formData.titre.trim()) newErrors.titre = 'Le titre est requis';
    if (!formData.description.trim()) newErrors.description = 'La description est requise';
    if (!formData.prix || formData.prix <= 0) newErrors.prix = 'Le prix doit être supérieur à 0';
    if (!formData.duree || formData.duree <= 0) newErrors.duree = 'La durée doit être supérieure à 0';
    if (!formData.placesTotales || formData.placesTotales <= 0) newErrors.placesTotales = 'Le nombre de places doit être supérieur à 0';

    // Validation des dates
    const dateDebut = new Date(formData.dateDebut);
    const dateFin = new Date(formData.dateFin);
    const maintenant = new Date();

    if (formData.dateDebut && dateDebut <= maintenant) {
      newErrors.dateDebut = 'La date de début doit être dans le futur';
    }

    if (formData.dateFin && formData.dateDebut && dateFin <= dateDebut) {
      newErrors.dateFin = 'La date de fin doit être après la date de début';
    }

    // Validation pour mode distanciel
    if (formData.mode === 'distanciel' && !formData.lienVisio.trim()) {
      newErrors.lienVisio = 'Le lien de visioconférence est requis pour le mode distanciel';
    }

    // Validation pour mode présentiel
    if ((formData.mode === 'presentiel' || formData.mode === 'hybride') && !formData.lieu.ville.trim()) {
      newErrors['lieu.ville'] = 'La ville est requise pour le mode présentiel';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Nettoyer les données avant envoi - ne pas envoyer les champs vides
    const cleanedData = {
      titre: formData.titre.trim(),
      description: formData.description.trim(),
      prix: parseFloat(formData.prix),
      duree: parseInt(formData.duree),
      placesTotales: parseInt(formData.placesTotales),
      placesRestantes: parseInt(formData.placesTotales), // Au début, toutes les places sont disponibles
      categorie: formData.categorie,
      niveau: formData.niveau,
      mode: formData.mode,
      statut: formData.statut,
      
      // Champs optionnels - seulement si remplis
      ...(formData.descriptionComplete.trim() && { descriptionComplete: formData.descriptionComplete.trim() }),
      ...(formData.dateDebut && { dateDebut: formData.dateDebut }),
      ...(formData.dateFin && { dateFin: formData.dateFin }),
      ...(formData.lienVisio.trim() && { lienVisio: formData.lienVisio.trim() }),
      
      // Lieu - seulement si au moins un champ est rempli
      ...((formData.lieu.ville.trim() || formData.lieu.adresse.trim() || formData.lieu.codePostal.trim() || formData.lieu.salle.trim()) && {
        lieu: {
          ...(formData.lieu.ville.trim() && { ville: formData.lieu.ville.trim() }),
          ...(formData.lieu.adresse.trim() && { adresse: formData.lieu.adresse.trim() }),
          ...(formData.lieu.codePostal.trim() && { codePostal: formData.lieu.codePostal.trim() }),
          ...(formData.lieu.salle.trim() && { salle: formData.lieu.salle.trim() })
        }
      }),
      
      // Formateur - seulement si au moins un champ est rempli
      ...((formData.formateur.nom.trim() || formData.formateur.bio.trim() || formData.formateur.expertise.some(e => e.trim())) && {
        formateur: {
          ...(formData.formateur.nom.trim() && { nom: formData.formateur.nom.trim() }),
          ...(formData.formateur.bio.trim() && { bio: formData.formateur.bio.trim() }),
          ...(formData.formateur.expertise.filter(e => e.trim()).length > 0 && {
            expertise: formData.formateur.expertise.filter(e => e.trim())
          })
        }
      }),
      
      // Certification - seulement si activée
      ...(formData.certification.disponible && {
        certification: {
          disponible: true,
          ...(formData.certification.nom.trim() && { nom: formData.certification.nom.trim() }),
          ...(formData.certification.organisme.trim() && { organisme: formData.certification.organisme.trim() })
        }
      }),
      
      // Arrays - seulement si éléments non vides
      ...(formData.prerequis.filter(p => p.trim()).length > 0 && {
        prerequis: formData.prerequis.filter(p => p.trim())
      }),
      ...(formData.objectifs.filter(o => o.trim()).length > 0 && {
        objectifs: formData.objectifs.filter(o => o.trim())
      }),
      ...(formData.materiel.filter(m => m.trim()).length > 0 && {
        materiel: formData.materiel.filter(m => m.trim())
      }),
      ...(formData.tags.filter(t => t.trim()).length > 0 && {
        tags: formData.tags.filter(t => t.trim())
      }),
      ...(formData.programme.filter(p => p.titre.trim()).length > 0 && {
        programme: formData.programme.filter(p => p.titre.trim())
      })
    };

    onSubmit(cleanedData);
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
    setErrors({});
  };

  // Réinitialiser le formulaire quand les données d'édition changent
  React.useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setErrors({});
    }
  }, [isOpen, editData, isEditing, getInitialFormData]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="formation-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className={`fas ${isEditing ? 'fa-edit' : 'fa-plus-circle'}`}></i>
            {isEditing ? 'Modifier la formation' : 'Ajouter une nouvelle formation'}
          </h2>
          <button className="modal-close" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-sections">
            {/* Section Informations générales */}
            <div className="form-section">
              <h3><i className="fas fa-info-circle"></i> Informations générales</h3>
              
              <div className="form-row">
                <FormInput
                  label="Titre de la formation *"
                  name="titre"
                  value={formData.titre}
                  onChange={handleChange}
                  error={errors.titre}
                  placeholder="Ex: Formation React Avancé"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Description courte *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={errors.description ? 'error' : ''}
                    placeholder="Description courte pour la liste des formations (max 500 caractères)"
                    rows="3"
                    maxLength="500"
                  />
                  {errors.description && <span className="error-text">{errors.description}</span>}
                  <small>{formData.description.length}/500 caractères</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Description complète</label>
                  <textarea
                    name="descriptionComplete"
                    value={formData.descriptionComplete}
                    onChange={handleChange}
                    placeholder="Description détaillée de la formation (max 2000 caractères)"
                    rows="4"
                    maxLength="2000"
                  />
                  <small>{formData.descriptionComplete.length}/2000 caractères</small>
                </div>
              </div>

              <div className="form-row form-row-3">
                <FormInput
                  label="Prix (€) *"
                  name="prix"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.prix}
                  onChange={handleChange}
                  error={errors.prix}
                  placeholder="299.99"
                />
                
                <FormInput
                  label="Durée (heures) *"
                  name="duree"
                  type="number"
                  min="1"
                  value={formData.duree}
                  onChange={handleChange}
                  error={errors.duree}
                  placeholder="14"
                />
                
                <FormInput
                  label="Nombre de places *"
                  name="placesTotales"
                  type="number"
                  min="1"
                  value={formData.placesTotales}
                  onChange={handleChange}
                  error={errors.placesTotales}
                  placeholder="20"
                />
              </div>

              <div className="form-row form-row-3">
                <div className="form-group">
                  <label>Catégorie *</label>
                  <select
                    name="categorie"
                    value={formData.categorie}
                    onChange={handleChange}
                    className="form-select"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Niveau</label>
                  <select
                    name="niveau"
                    value={formData.niveau}
                    onChange={handleChange}
                    className="form-select"
                  >
                    {niveaux.map(niveau => (
                      <option key={niveau.value} value={niveau.value}>{niveau.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Mode</label>
                  <select
                    name="mode"
                    value={formData.mode}
                    onChange={handleChange}
                    className="form-select"
                  >
                    {modes.map(mode => (
                      <option key={mode.value} value={mode.value}>{mode.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section Dates */}
            <div className="form-section">
              <h3><i className="fas fa-calendar-alt"></i> Planning</h3>
              
              <div className="form-row form-row-2">
                <FormInput
                  label="Date de début"
                  name="dateDebut"
                  type="datetime-local"
                  value={formData.dateDebut}
                  onChange={handleChange}
                  error={errors.dateDebut}
                />
                
                <FormInput
                  label="Date de fin"
                  name="dateFin"
                  type="datetime-local"
                  value={formData.dateFin}
                  onChange={handleChange}
                  error={errors.dateFin}
                />
              </div>
            </div>

            {/* Section Lieu/Modalités */}
            {(formData.mode === 'presentiel' || formData.mode === 'hybride') && (
              <div className="form-section">
                <h3><i className="fas fa-map-marker-alt"></i> Lieu de formation</h3>
                
                <div className="form-row form-row-2">
                  <FormInput
                    label="Adresse"
                    name="lieu.adresse"
                    value={formData.lieu.adresse}
                    onChange={handleChange}
                    placeholder="123 Rue de la Formation"
                  />
                  
                  <FormInput
                    label="Salle"
                    name="lieu.salle"
                    value={formData.lieu.salle}
                    onChange={handleChange}
                    placeholder="Salle A1"
                  />
                </div>
                
                <div className="form-row form-row-2">
                  <FormInput
                    label="Ville *"
                    name="lieu.ville"
                    value={formData.lieu.ville}
                    onChange={handleChange}
                    error={errors['lieu.ville']}
                    placeholder="Paris"
                  />
                  
                  <FormInput
                    label="Code postal"
                    name="lieu.codePostal"
                    value={formData.lieu.codePostal}
                    onChange={handleChange}
                    placeholder="75001"
                  />
                </div>
              </div>
            )}

            {(formData.mode === 'distanciel' || formData.mode === 'hybride') && (
              <div className="form-section">
                <h3><i className="fas fa-video"></i> Modalités distancielles</h3>
                
                <div className="form-row">
                  <FormInput
                    label={`Lien de visioconférence ${formData.mode === 'distanciel' ? '*' : ''}`}
                    name="lienVisio"
                    value={formData.lienVisio}
                    onChange={handleChange}
                    error={errors.lienVisio}
                    placeholder="https://meet.google.com/abc-defg-hij"
                  />
                </div>
              </div>
            )}

            {/* Section Programme */}
            <div className="form-section">
              <h3><i className="fas fa-list-ol"></i> Programme</h3>
              
              {formData.programme.map((item, index) => (
                <div key={index} className="programme-item">
                  <div className="programme-header">
                    <h4>Module {index + 1}</h4>
                    {formData.programme.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeProgrammeItem(index)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                  
                  <div className="form-row form-row-2">
                    <FormInput
                      label="Titre du module"
                      value={item.titre}
                      onChange={(e) => handleProgrammeChange(index, 'titre', e.target.value)}
                      placeholder="Introduction aux concepts"
                    />
                    
                    <FormInput
                      label="Durée (heures)"
                      type="number"
                      min="0"
                      step="0.5"
                      value={item.duree}
                      onChange={(e) => handleProgrammeChange(index, 'duree', e.target.value)}
                      placeholder="2"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Description du module</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => handleProgrammeChange(index, 'description', e.target.value)}
                        placeholder="Contenu détaillé du module"
                        rows="2"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                className="btn-add-item"
                onClick={addProgrammeItem}
              >
                <i className="fas fa-plus"></i>
                Ajouter un module
              </button>
            </div>

            {/* Section Arrays */}
            <div className="form-section">
              <h3><i className="fas fa-tasks"></i> Détails supplémentaires</h3>
              
              {/* Objectifs */}
              <div className="array-section">
                <label>Objectifs pédagogiques</label>
                {formData.objectifs.map((objectif, index) => (
                  <div key={index} className="array-item">
                    <input
                      type="text"
                      value={objectif}
                      onChange={(e) => handleArrayChange('objectifs', index, e.target.value)}
                      placeholder="Objectif pédagogique"
                    />
                    {formData.objectifs.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeArrayItem('objectifs', index)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-add-small"
                  onClick={() => addArrayItem('objectifs')}
                >
                  <i className="fas fa-plus"></i> Ajouter un objectif
                </button>
              </div>

              {/* Prérequis */}
              <div className="array-section">
                <label>Prérequis</label>
                {formData.prerequis.map((prerequis, index) => (
                  <div key={index} className="array-item">
                    <input
                      type="text"
                      value={prerequis}
                      onChange={(e) => handleArrayChange('prerequis', index, e.target.value)}
                      placeholder="Prérequis nécessaire"
                    />
                    {formData.prerequis.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeArrayItem('prerequis', index)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-add-small"
                  onClick={() => addArrayItem('prerequis')}
                >
                  <i className="fas fa-plus"></i> Ajouter un prérequis
                </button>
              </div>

              {/* Matériel */}
              <div className="array-section">
                <label>Matériel fourni</label>
                {formData.materiel.map((item, index) => (
                  <div key={index} className="array-item">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange('materiel', index, e.target.value)}
                      placeholder="Matériel ou ressource fournie"
                    />
                    {formData.materiel.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeArrayItem('materiel', index)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-add-small"
                  onClick={() => addArrayItem('materiel')}
                >
                  <i className="fas fa-plus"></i> Ajouter du matériel
                </button>
              </div>

              {/* Tags */}
              <div className="array-section">
                <label>Tags</label>
                {formData.tags.map((tag, index) => (
                  <div key={index} className="array-item">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => handleArrayChange('tags', index, e.target.value)}
                      placeholder="Tag pour faciliter la recherche"
                    />
                    {formData.tags.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeArrayItem('tags', index)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-add-small"
                  onClick={() => addArrayItem('tags')}
                >
                  <i className="fas fa-plus"></i> Ajouter un tag
                </button>
              </div>
            </div>

            {/* Section Formateur */}
            <div className="form-section">
              <h3><i className="fas fa-chalkboard-teacher"></i> Formateur</h3>
              
              <div className="form-row">
                <FormInput
                  label="Nom du formateur"
                  name="formateur.nom"
                  value={formData.formateur.nom}
                  onChange={handleChange}
                  placeholder="Jean Dupont"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Biographie</label>
                  <textarea
                    name="formateur.bio"
                    value={formData.formateur.bio}
                    onChange={handleChange}
                    placeholder="Présentation du formateur et de son expérience"
                    rows="3"
                  />
                </div>
              </div>

              <div className="array-section">
                <label>Expertises</label>
                {formData.formateur.expertise.map((expertise, index) => (
                  <div key={index} className="array-item">
                    <input
                      type="text"
                      value={expertise}
                      onChange={(e) => {
                        const newExpertise = [...formData.formateur.expertise];
                        newExpertise[index] = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          formateur: { ...prev.formateur, expertise: newExpertise }
                        }));
                      }}
                      placeholder="Domaine d'expertise"
                    />
                    {formData.formateur.expertise.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => {
                          const newExpertise = formData.formateur.expertise.filter((_, i) => i !== index);
                          setFormData(prev => ({
                            ...prev,
                            formateur: { ...prev.formateur, expertise: newExpertise }
                          }));
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-add-small"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      formateur: { 
                        ...prev.formateur, 
                        expertise: [...prev.formateur.expertise, ''] 
                      }
                    }));
                  }}
                >
                  <i className="fas fa-plus"></i> Ajouter une expertise
                </button>
              </div>
            </div>

            {/* Section Certification */}
            <div className="form-section">
              <h3><i className="fas fa-certificate"></i> Certification</h3>
              
              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="certification.disponible"
                      checked={formData.certification.disponible}
                      onChange={handleChange}
                    />
                    <span className="checkmark"></span>
                    Certification disponible
                  </label>
                </div>
              </div>

              {formData.certification.disponible && (
                <>
                  <div className="form-row form-row-2">
                    <FormInput
                      label="Nom de la certification"
                      name="certification.nom"
                      value={formData.certification.nom}
                      onChange={handleChange}
                      placeholder="Certification React Developer"
                    />
                    
                    <FormInput
                      label="Organisme certificateur"
                      name="certification.organisme"
                      value={formData.certification.organisme}
                      onChange={handleChange}
                      placeholder="Tech Institute"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Section Statut */}
            <div className="form-section">
              <h3><i className="fas fa-toggle-on"></i> Publication</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Statut de publication</label>
                  <select
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="publiee">Publier maintenant</option>
                    <option value="brouillon">Brouillon</option>
                  </select>
                  <small>
                    {formData.statut === 'brouillon' 
                      ? 'La formation sera sauvegardée mais pas visible publiquement'
                      : 'La formation sera immédiatement visible et réservable'
                    }
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={<i className="fas fa-save"></i>}
            >
              {isEditing 
                ? 'Mettre à jour' 
                : (formData.statut === 'publiee' ? 'Créer et publier' : 'Enregistrer en brouillon')
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormationModal;
