const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const Agency = require('../models/Agency');

// @route   GET /api/dashboard/summary
// @desc    Get dashboard counts & statistical summaries
// @access  Public
router.get('/summary', async (req, res) => {
  try {
    const totalIncidents = await Incident.countDocuments();
    const activeIncidents = await Incident.countDocuments({ status: { $ne: 'Closed' } });

    const totalAgencies = await Agency.countDocuments();
    const availableAgencies = await Agency.countDocuments({ status: 'Available' });
    const busyAgencies = await Agency.countDocuments({ status: 'Busy' });

    const incidentsByStatus = {
      Reported: await Incident.countDocuments({ status: 'Reported' }),
      UnderReview: await Incident.countDocuments({ status: 'Under Review' }),
      Assigned: await Incident.countDocuments({ status: 'Assigned' }),
      InProgress: await Incident.countDocuments({ status: 'In Progress' }),
      Resolved: await Incident.countDocuments({ status: 'Resolved' }),
      Closed: await Incident.countDocuments({ status: 'Closed' })
    };

    const incidentsBySeverity = {
      Critical: await Incident.countDocuments({ 'aiAnalysis.severity': 'Critical' }),
      High: await Incident.countDocuments({ 'aiAnalysis.severity': 'High' }),
      Moderate: await Incident.countDocuments({ 'aiAnalysis.severity': 'Moderate' }),
      Low: await Incident.countDocuments({ 'aiAnalysis.severity': 'Low' })
    };

    res.json({
      totalIncidents,
      activeIncidents,
      totalAgencies,
      availableAgencies,
      busyAgencies,
      incidentsByStatus,
      incidentsBySeverity
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/dashboard/map
// @desc    Get map dataset containing all active incidents and agency positions
// @access  Public
router.get('/map', async (req, res) => {
  try {
    const incidents = await Incident.find({ status: { $ne: 'Closed' } })
      .populate('assignedAgencies.agency', 'name type contact status')
      .select('description location address aiAnalysis status priority assignedAgencies createdAt');

    const agencies = await Agency.find()
      .select('name type registrationId contact baseLocation currentLocation status capacity verified lastUpdated');

    res.json({
      incidents,
      agencies
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
