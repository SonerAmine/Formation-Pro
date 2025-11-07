const Reservation = require('../models/Reservation');
const Formation = require('../models/Formation');

// @desc    Créer une nouvelle réservation
// @route   POST /api/reservations
// @access  Private
const createReservation = async (req, res) => {
  try {
    const { formationId, nom, prenom, email, telephone } = req.body;

    // Vérifier si la formation existe et est disponible
    const formation = await Formation.findById(formationId);
    if (!formation) {
      return res.status(404).json({
        success: false,
        error: 'Formation non trouvée'
      });
    }

    if (formation.statut !== 'publiee' || !formation.active) {
      return res.status(400).json({
        success: false,
        error: 'Cette formation n\'est pas disponible à la réservation'
      });
    }

    if (formation.placesRestantes <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucune place disponible pour cette formation'
      });
    }

    // Plus de vérification de date limite - inscriptions toujours ouvertes

    // Vérifier si l'utilisateur a déjà réservé cette formation
    const existingReservation = await Reservation.findOne({
      userId: req.user.id,
      formationId,
      statut: { $in: ['active', 'terminee'] }
    });

    if (existingReservation) {
      return res.status(400).json({
        success: false,
        error: 'Vous avez déjà réservé cette formation'
      });
    }

    // Créer la réservation
    const reservation = await Reservation.create({
      userId: req.user.id,
      formationId,
      nom,
      prenom,
      email,
      telephone
    });

    // Populer les données de la formation
    await reservation.populate('formationId', 'titre prix duree dateLimite');

    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      data: reservation
    });

    console.log(`✅ Nouvelle réservation: ${formation.titre} par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création de la réservation'
    });
  }
};

// @desc    Récupérer les réservations de l'utilisateur connecté
// @route   GET /api/reservations/my
// @access  Private
const getMyReservations = async (req, res) => {
  try {
    const { page = 1, limit = 10, statut } = req.query;

    const options = {
      statut,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const reservations = await Reservation.getByUser(req.user.id, options);

    const total = await Reservation.countDocuments({
      userId: req.user.id,
      ...(statut && { statut })
    });

    res.json({
      success: true,
      count: reservations.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: reservations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des réservations'
    });
  }
};

// @desc    Récupérer une réservation par ID
// @route   GET /api/reservations/:id
// @access  Private
const getReservation = async (req, res) => {
  try {
    // La réservation est déjà récupérée par le middleware canAccessReservation
    const reservation = req.reservation;

    await reservation.populate([
      { path: 'formationId', select: 'titre description prix duree dateLimite dateDebut categorie' },
      { path: 'userId', select: 'nom prenom email' }
    ]);

    res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de la réservation'
    });
  }
};

// @desc    Annuler une réservation
// @route   PUT /api/reservations/:id/cancel
// @access  Private
const cancelReservation = async (req, res) => {
  try {
    const { raison } = req.body;
    const reservation = req.reservation;

    if (reservation.statut !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Cette réservation ne peut pas être annulée'
      });
    }

    // Vérifier si l'annulation est encore possible
    const formation = await Formation.findById(reservation.formationId);
    // Annulation toujours possible (plus de date limite)

    // Annuler la réservation
    const annulePar = req.user.role === 'admin' ? 'admin' : 'user';
    await reservation.annuler(raison || 'Annulation demandée par l\'utilisateur', annulePar);

    res.json({
      success: true,
      message: 'Réservation annulée avec succès',
      data: reservation
    });

    console.log(`✅ Réservation annulée: ${reservation._id} par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la réservation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur lors de l\'annulation de la réservation'
    });
  }
};

// @desc    Récupérer toutes les réservations (Admin)
// @route   GET /api/reservations
// @access  Private/Admin
const getAllReservations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      statut,
      formationId,
      sortBy = 'dateReservation',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (statut) filter.statut = statut;
    if (formationId) filter.formationId = formationId;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reservations = await Reservation.find(filter)
      .populate('userId', 'nom prenom email')
      .populate('formationId', 'titre prix categorie')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Reservation.countDocuments(filter);

    res.json({
      success: true,
      count: reservations.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: reservations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations (admin):', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des réservations'
    });
  }
};

// @desc    Mettre à jour le statut d'une réservation (Admin)
// @route   PUT /api/reservations/:id/status
// @access  Private/Admin
const updateReservationStatus = async (req, res) => {
  try {
    const { statut, notes } = req.body;

    if (!['active', 'annulee', 'terminee', 'absent'].includes(statut)) {
      return res.status(400).json({
        success: false,
        error: 'Statut invalide'
      });
    }

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Réservation non trouvée'
      });
    }

    // Mettre à jour le statut
    reservation.statut = statut;
    if (notes) reservation.notes = notes;

    // Si on annule, définir les informations d'annulation
    if (statut === 'annulee' && reservation.statut !== 'annulee') {
      reservation.dateAnnulation = new Date();
      reservation.annulePar = 'admin';
      reservation.raisonAnnulation = notes || 'Annulé par l\'administrateur';
    }

    await reservation.save();

    res.json({
      success: true,
      message: 'Statut de la réservation mis à jour avec succès',
      data: reservation
    });

    console.log(`✅ Statut de réservation mis à jour: ${reservation._id} -> ${statut} par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour du statut'
    });
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  getReservation,
  cancelReservation,
  getAllReservations,
  updateReservationStatus
};
