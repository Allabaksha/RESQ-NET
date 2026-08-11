const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const Agency = require('../models/Agency');
const { protect, authorize } = require('../middleware/authMiddleware');
const { analyzeIncident } = require('../services/aiService');
const movementService = require('../services/movementService');

// @route   GET /api/incidents
// @desc    List incidents with optional filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { status, severity, priority } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (severity) filter['aiAnalysis.severity'] = severity;
    if (priority) filter.priority = priority;

    const incidents = await Incident.find(filter)
      .populate('reportedBy', 'name email role')
      .populate('assignedAgencies.agency')
      .sort({ createdAt: -1 });

    res.json(incidents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/incidents/:id
// @desc    Get single incident details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'name email role phone')
      .populate('assignedAgencies.agency')
      .populate('timeline.by', 'name role');

    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/incidents
// @desc    Create / report a new incident
// @access  Public or Protected
router.post('/', async (req, res) => {
  try {
    const { description, location, address, priority, autoAnalyze } = req.body;

    if (!description || !location || !location.coordinates) {
      return res.status(400).json({ message: "Description and location coordinates [lng, lat] are required." });
    }

    const userId = req.user ? req.user.id : null;

    const incident = new Incident({
      reportedBy: userId,
      description,
      location: {
        type: "Point",
        coordinates: [parseFloat(location.coordinates[0]), parseFloat(location.coordinates[1])]
      },
      address: address || "Reported Location",
      priority: priority || "Medium",
      status: "Reported",
      timeline: [{
        event: "Incident reported by citizen/officer",
        timestamp: new Date(),
        by: userId
      }]
    });

    // Auto-trigger AI Analysis if requested
    if (autoAnalyze !== false) {
      const aiResult = await analyzeIncident(description);
      incident.aiAnalysis = aiResult;
      incident.timeline.push({
        event: `AI Incident Classification generated: ${aiResult.incidentType} (Severity: ${aiResult.severity})`,
        timestamp: new Date(),
        by: null
      });
    }

    await incident.save();

    // Broadcast socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('incident:new', incident);
    }

    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/incidents/:id/analyze
// @desc    Trigger/Re-trigger AI classification using Ollama
// @access  Protected (Officer / Admin / Citizen)
router.post('/:id/analyze', protect, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    const aiResult = await analyzeIncident(incident.description);
    incident.aiAnalysis = {
      ...aiResult,
      reviewedByOfficer: false
    };

    incident.timeline.push({
      event: `AI analysis performed: ${aiResult.incidentType} (${aiResult.severity})`,
      timestamp: new Date(),
      by: req.user.id
    });

    await incident.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('incident:statusUpdate', incident);
    }

    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PATCH /api/incidents/:id/review
// @desc    Officer reviews and modifies/approves AI classification
// @access  Protected (Officer / Admin)
router.patch('/:id/review', protect, authorize('officer', 'admin'), async (req, res) => {
  try {
    const { incidentType, severity, estimatedVictims, suggestedResources } = req.body;
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    incident.aiAnalysis = {
      incidentType: incidentType || incident.aiAnalysis?.incidentType || "Disaster Emergency",
      severity: severity || incident.aiAnalysis?.severity || "High",
      estimatedVictims: estimatedVictims || incident.aiAnalysis?.estimatedVictims || "Civilian impacts reported",
      suggestedResources: suggestedResources || incident.aiAnalysis?.suggestedResources || [],
      reviewedByOfficer: true
    };

    if (incident.status === "Reported") {
      incident.status = "Under Review";
    }

    incident.timeline.push({
      event: `AI classification reviewed and confirmed by Officer (${req.user.name})`,
      timestamp: new Date(),
      by: req.user.id
    });

    await incident.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('incident:statusUpdate', incident);
    }

    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PATCH /api/incidents/:id/assign
// @desc    Officer assigns one or more agencies to incident
// @access  Protected (Officer / Admin)
router.patch('/:id/assign', protect, authorize('officer', 'admin'), async (req, res) => {
  try {
    const { agencyIds } = req.body; // Array of agency IDs
    if (!agencyIds || !Array.isArray(agencyIds) || agencyIds.length === 0) {
      return res.status(400).json({ message: "agencyIds must be a non-empty array" });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    const newlyAssignedNames = [];

    for (const agencyId of agencyIds) {
      const existing = incident.assignedAgencies.find(a => a.agency.toString() === agencyId.toString());
      if (!existing) {
        incident.assignedAgencies.push({
          agency: agencyId,
          assignedAt: new Date(),
          responseStatus: 'Pending'
        });
        const ag = await Agency.findById(agencyId);
        if (ag) newlyAssignedNames.push(ag.name);
      }
    }

    incident.status = "Assigned";
    incident.timeline.push({
      event: `Assigned agencies: ${newlyAssignedNames.join(', ') || 'Rescue Units'}`,
      timestamp: new Date(),
      by: req.user.id
    });

    await incident.save();
    await incident.populate('assignedAgencies.agency');

    const io = req.app.get('io');
    if (io) {
      io.emit('incident:assigned', { incidentId: incident._id, agencyIds });
      io.emit('incident:statusUpdate', incident);
    }

    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PATCH /api/incidents/:id/respond
// @desc    Agency accepts or rejects dispatch assignment
// @access  Protected (Agency / Officer / Admin)
router.patch('/:id/respond', protect, async (req, res) => {
  try {
    const { agencyId, responseStatus } = req.body; // "Accepted", "Rejected", "En Route", "On Scene", "Completed"
    if (!agencyId || !responseStatus) {
      return res.status(400).json({ message: "agencyId and responseStatus are required" });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    const assignment = incident.assignedAgencies.find(a => a.agency.toString() === agencyId.toString());
    if (!assignment) {
      return res.status(404).json({ message: "Agency assignment not found for this incident" });
    }

    assignment.responseStatus = responseStatus;

    if (responseStatus === "Accepted" || responseStatus === "En Route" || responseStatus === "On Scene") {
      incident.status = "In Progress";
      // Record when the unit departed for the scene
      if (!assignment.enRouteAt) assignment.enRouteAt = new Date();
      if (responseStatus === "On Scene" && !assignment.arrivedAt) assignment.arrivedAt = new Date();
      // Update agency status to Busy
      await Agency.findByIdAndUpdate(agencyId, { status: "Busy", lastUpdated: new Date() });

      // Live en-route movement simulation while the unit travels to the scene
      if (responseStatus === "Accepted" || responseStatus === "En Route") {
        const agency = await Agency.findById(agencyId);
        const io = req.app.get('io');
        if (io && agency && incident.location && incident.location.coordinates) {
          movementService.startMovement({
            io,
            agencyId,
            agencyName: agency.name,
            from: agency.currentLocation?.coordinates || agency.baseLocation?.coordinates || incident.location.coordinates,
            to: incident.location.coordinates,
            incidentId: incident._id,
            onArrive: async (finalCoords, { arrivedAt, tripSeconds }) => {
              // Persist the final reported position once the unit arrives on scene
              await Agency.findByIdAndUpdate(agencyId, {
                currentLocation: { type: "Point", coordinates: finalCoords },
                lastUpdated: new Date()
              });
              const updated = await Agency.findById(agencyId);
              if (io && updated) io.emit('agency:statusUpdate', updated);

              // Record the official arrival time on the incident assignment
              const inc = await Incident.findById(incident._id);
              const asg = inc?.assignedAgencies.find(a => a.agency.toString() === agencyId.toString());
              if (asg) {
                asg.arrivedAt = new Date(arrivedAt);
                if (!asg.enRouteAt) asg.enRouteAt = asg.assignedAt;
                // Auto-detect arrival: the unit reached the scene location
                if (asg.responseStatus === 'En Route' || asg.responseStatus === 'Accepted') {
                  asg.responseStatus = 'On Scene';
                }
                await inc.save();
              }
              if (inc) await inc.populate('assignedAgencies.agency');
              if (io) {
                io.emit('incident:statusUpdate', inc || incident);
                io.emit('assignment:arrived', {
                  agencyId,
                  incidentId: incident._id,
                  arrivedAt,
                  tripSeconds
                });
              }
            }
          });
        }
      } else if (responseStatus === "On Scene") {
        // Unit reports on scene: stop movement, persist last reported position
        const io = req.app.get('io');
        const lastCoords = movementService.stopMovement(agencyId, io);
        if (lastCoords) {
          await Agency.findByIdAndUpdate(agencyId, {
            currentLocation: { type: "Point", coordinates: lastCoords },
            lastUpdated: new Date()
          });
        }
        if (io) {
          io.emit('assignment:arrived', {
            agencyId,
            incidentId: incident._id,
            arrivedAt: assignment.arrivedAt || new Date(),
            tripSeconds: 0
          });
        }
      }
    } else if (responseStatus === "Completed") {
      assignment.completedAt = new Date();
      if (!assignment.arrivedAt) assignment.arrivedAt = new Date();
      // Stop any active movement and persist the final reported position
      const io = req.app.get('io');
      const lastCoords = movementService.stopMovement(agencyId, io);
      if (lastCoords) {
        await Agency.findByIdAndUpdate(agencyId, {
          currentLocation: { type: "Point", coordinates: lastCoords },
          lastUpdated: new Date()
        });
      }
      // Check if all assigned agencies completed
      const allDone = incident.assignedAgencies.every(a => a.responseStatus === "Completed");
      if (allDone) {
        incident.status = "Resolved";
      }
      await Agency.findByIdAndUpdate(agencyId, { status: "Available", lastUpdated: new Date() });
    } else if (responseStatus === "Rejected") {
      // Unit declined the dispatch - stop any active movement
      const io = req.app.get('io');
      movementService.stopMovement(agencyId, io);
    }

    incident.timeline.push({
      event: `Agency response updated to '${responseStatus}'`,
      timestamp: new Date(),
      by: req.user.id
    });

    await incident.save();
    await incident.populate('assignedAgencies.agency');

    const io = req.app.get('io');
    if (io) {
      io.emit('incident:statusUpdate', incident);
    }

    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PATCH /api/incidents/:id/status
// @desc    Update incident overall status ("Reported", "Under Review", "Assigned", "In Progress", "Resolved", "Closed")
// @access  Protected (Officer / Admin)
router.patch('/:id/status', protect, authorize('officer', 'admin'), async (req, res) => {
  try {
    const { status, note } = req.body;
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    incident.status = status;
    incident.timeline.push({
      event: `Status changed to '${status}' ${note ? `(${note})` : ''}`,
      timestamp: new Date(),
      by: req.user.id
    });

    // Stop any en-route movements when the incident closes or resolves
    if (status === "Closed" || status === "Resolved") {
      movementService.stopMovementsForIncident(incident._id, req.app.get('io'));
    }

    await incident.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('incident:statusUpdate', incident);
    }

    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/incidents/:id/timeline
// @desc    Get incident timeline log
// @access  Public
router.get('/:id/timeline', async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id).populate('timeline.by', 'name role');
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    res.json(incident.timeline);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
