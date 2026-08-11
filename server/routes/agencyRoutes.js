const express = require('express');
const router = express.Router();
const Agency = require('../models/Agency');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/agencies/nearby
// @desc    Geospatial search for nearest matching available rescue agencies
// @access  Public / Private
router.get('/nearby', async (req, res) => {
  try {
    const { lng, lat, radius = 25000, type, status } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ message: "Parameters 'lng' and 'lat' are required for geospatial query" });
    }

    const query = {};

    if (status) {
      query.status = status;
    } else {
      query.status = "Available"; // default to available
    }

    if (type) {
      const typesArr = Array.isArray(type) ? type : type.split(',').map(t => t.trim());
      query.type = { $in: typesArr };
    }

    query.currentLocation = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: parseInt(radius, 10) // distance in meters
      }
    };

    const agencies = await Agency.find(query);
    res.json(agencies);
  } catch (err) {
    console.error("[Geospatial Error]", err);
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/agencies
// @desc    Get all agencies (optional filters)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { type, status, verified } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (verified !== undefined) filter.verified = verified === 'true';

    const agencies = await Agency.find(filter).sort({ name: 1 });
    res.json(agencies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/agencies/:id
// @desc    Get single agency by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });
    res.json(agency);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/agencies
// @desc    Register a new agency
// @access  Public or Protected
router.post('/', async (req, res) => {
  try {
    const { name, type, registrationId, contact, baseLocation, currentLocation, capacity } = req.body;

    const existing = await Agency.findOne({ registrationId });
    if (existing) {
      return res.status(400).json({ message: `Agency with registration ID '${registrationId}' already exists.` });
    }

    const agency = new Agency({
      name,
      type,
      registrationId,
      contact: contact || {},
      baseLocation: baseLocation || { type: "Point", coordinates: [72.8777, 19.0760] }, // default Mumbai [lng, lat]
      currentLocation: currentLocation || baseLocation || { type: "Point", coordinates: [72.8777, 19.0760] },
      capacity: capacity || { personnel: 10, vehicles: 2 },
      status: "Available",
      verified: false
    });

    await agency.save();

    // Broadcast socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('agency:new', agency);
    }

    res.status(201).json(agency);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PATCH /api/agencies/:id/status
// @desc    Update agency status (Available / Busy / Unavailable)
// @access  Protected (Agency / Officer / Admin)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Available", "Busy", "Unavailable"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const agency = await Agency.findById(req.params.id);
    if (!agency) return res.status(404).json({ message: "Agency not found" });

    agency.status = status;
    agency.lastUpdated = new Date();
    await agency.save();

    // Broadcast socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('agency:statusUpdate', agency);
    }

    res.json(agency);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PATCH /api/agencies/:id/location
// @desc    Update agency current live location coordinates [lng, lat]
// @access  Protected (Agency / Officer / Admin)
router.patch('/:id/location', protect, async (req, res) => {
  try {
    const { coordinates } = req.body; // [lng, lat]
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ message: "Coordinates array [lng, lat] is required" });
    }

    const agency = await Agency.findById(req.params.id);
    if (!agency) return res.status(404).json({ message: "Agency not found" });

    agency.currentLocation = {
      type: "Point",
      coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])]
    };
    agency.lastUpdated = new Date();
    await agency.save();

    // Broadcast socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('agency:statusUpdate', agency);
    }

    res.json(agency);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PATCH /api/agencies/:id/verify
// @desc    Verify agency (Admin action)
// @access  Protected (Admin / Officer)
router.patch('/:id/verify', protect, authorize('admin', 'officer'), async (req, res) => {
  try {
    const { verified } = req.body;
    const agency = await Agency.findById(req.params.id);
    if (!agency) return res.status(404).json({ message: "Agency not found" });

    agency.verified = verified !== undefined ? verified : true;
    await agency.save();

    res.json(agency);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
