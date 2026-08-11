const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Agency = require('./models/Agency');
const Incident = require('./models/Incident');

const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resqnet';

async function seedData() {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(connStr, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected!');

    // Clear existing data
    await User.deleteMany({});
    await Agency.deleteMany({});
    await Incident.deleteMany({});
    console.log('Cleared existing collections.');

    // Passwords hash
    const salt = await bcrypt.genSalt(10);
    const commonPasswordHash = await bcrypt.hash('password123', salt);

    // Create Agencies
    const agenciesData = [
      {
        name: "8th Battalion NDRF (National Disaster Response Force)",
        type: "NDRF",
        registrationId: "GOV-NDRF-801",
        contact: { phone: "+91-9876543210", email: "cmd.8ndrf@gov.in", officerInCharge: "Commandant R. K. Sharma" },
        baseLocation: { type: "Point", coordinates: [72.8777, 19.0760] }, // Mumbai
        currentLocation: { type: "Point", coordinates: [72.8850, 19.0800] },
        status: "Available",
        capacity: { personnel: 45, vehicles: 6 },
        verified: true
      },
      {
        name: "SDRF Disaster Rapid Action Unit",
        type: "SDRF",
        registrationId: "GOV-SDRF-402",
        contact: { phone: "+91-9811223344", email: "dispatch@sdrf.gov.in", officerInCharge: "Major V. Nair" },
        baseLocation: { type: "Point", coordinates: [76.1320, 11.6103] }, // Kerala / Wayanad
        currentLocation: { type: "Point", coordinates: [76.1400, 11.6150] },
        status: "Available",
        capacity: { personnel: 30, vehicles: 4 },
        verified: true
      },
      {
        name: "Mumbai Fire & Rescue Command",
        type: "Fire & Rescue",
        registrationId: "MCGM-FIRE-001",
        contact: { phone: "101", email: "control@mumbaifire.org", officerInCharge: "Chief Officer S. Patil" },
        baseLocation: { type: "Point", coordinates: [72.8347, 18.9388] }, // Fort, Mumbai
        currentLocation: { type: "Point", coordinates: [72.8400, 18.9450] },
        status: "Available",
        capacity: { personnel: 60, vehicles: 12 },
        verified: true
      },
      {
        name: "Apex Emergency Ambulance Services",
        type: "Ambulance",
        registrationId: "MED-EMS-108",
        contact: { phone: "108", email: "dispatches@apexems.org", officerInCharge: "Dr. A. Verma" },
        baseLocation: { type: "Point", coordinates: [72.8500, 19.0500] }, // Bandra, Mumbai
        currentLocation: { type: "Point", coordinates: [72.8550, 19.0550] },
        status: "Available",
        capacity: { personnel: 25, vehicles: 8 },
        verified: true
      },
      {
        name: "Central Police Control Taskforce",
        type: "Police",
        registrationId: "POL-MUM-100",
        contact: { phone: "100", email: "disastercell@mumbaipolice.gov.in", officerInCharge: "Inspector G. Deshmukh" },
        baseLocation: { type: "Point", coordinates: [72.8250, 18.9750] },
        currentLocation: { type: "Point", coordinates: [72.8280, 18.9780] },
        status: "Available",
        capacity: { personnel: 100, vehicles: 15 },
        verified: true
      },
      {
        name: "Civil Defence Corps Corps-1",
        type: "Civil Defence",
        registrationId: "CIV-DEF-099",
        contact: { phone: "+91-9444012345", email: "volunteers@civildefence.in", officerInCharge: "Captain P. Swaminathan" },
        baseLocation: { type: "Point", coordinates: [80.2707, 13.0827] }, // Chennai
        currentLocation: { type: "Point", coordinates: [80.2750, 13.0850] },
        status: "Available",
        capacity: { personnel: 80, vehicles: 5 },
        verified: true
      }
    ];

    const createdAgencies = await Agency.create(agenciesData);
    console.log(`Created ${createdAgencies.length} Agencies with 2dsphere indexing.`);

    // Create Users
    const usersData = [
      {
        name: "Disaster Control Officer",
        email: "officer@resq.net",
        passwordHash: commonPasswordHash,
        role: "officer",
        phone: "+91-9900011122"
      },
      {
        name: "System Administrator",
        email: "admin@resq.net",
        passwordHash: commonPasswordHash,
        role: "admin",
        phone: "+91-9900000000"
      },
      {
        name: "Citizen Reporter",
        email: "citizen@resq.net",
        passwordHash: commonPasswordHash,
        role: "citizen",
        phone: "+91-9876500000"
      },
      {
        name: "NDRF Agency Representative",
        email: "agency@resq.net",
        passwordHash: commonPasswordHash,
        role: "agency",
        agency: createdAgencies[0]._id,
        phone: "+91-9876543210"
      }
    ];

    const createdUsers = await User.create(usersData);
    console.log(`Created ${createdUsers.length} Demo Users.`);

    // Create Sample Incidents
    const incidentsData = [
      {
        reportedBy: createdUsers[2]._id, // Citizen
        description: "Severe urban flooding reported in Kurla West near railway tracks. Water level rising rapidly over 4 feet. Around 25 people stuck on roof of local commercial center requiring immediate boat evacuation and medical triage.",
        location: { type: "Point", coordinates: [72.8750, 19.0650] }, // Near NDRF base in Mumbai
        address: "LBS Marg, Kurla West, Mumbai, Maharashtra",
        priority: "High",
        status: "Reported",
        aiAnalysis: {
          incidentType: "Flash Flood / Water Logging",
          severity: "Critical",
          estimatedVictims: "Estimated 25+ civilians stranded on rooftop",
          suggestedResources: ["NDRF", "SDRF", "Fire & Rescue", "Ambulance"],
          reviewedByOfficer: false
        },
        timeline: [
          {
            event: "Incident reported by citizen",
            timestamp: new Date(Date.now() - 3600000),
            by: createdUsers[2]._id
          },
          {
            event: "AI Incident Classification generated: Flash Flood / Water Logging (Severity: Critical)",
            timestamp: new Date(Date.now() - 3550000),
            by: null
          }
        ]
      },
      {
        reportedBy: createdUsers[0]._id, // Officer
        description: "Landslide and partial cliff collapse triggered by heavy monsoons along mountain pass highway. Multiple vehicles trapped under rock debris. Search and heavy machinery excavation urgently required.",
        location: { type: "Point", coordinates: [76.1380, 11.6120] }, // Wayanad, Kerala
        address: "Thamarassery Churam Pass, Wayanad District, Kerala",
        priority: "Critical",
        status: "In Progress",
        aiAnalysis: {
          incidentType: "Structural Collapse / Landslide",
          severity: "Critical",
          estimatedVictims: "Estimated 10+ trapped beneath debris",
          suggestedResources: ["NDRF", "SDRF", "Fire & Rescue", "Ambulance"],
          reviewedByOfficer: true
        },
        assignedAgencies: [
          {
            agency: createdAgencies[1]._id, // SDRF
            assignedAt: new Date(Date.now() - 7200000),
            responseStatus: "On Scene"
          }
        ],
        timeline: [
          {
            event: "Incident logged by Officer",
            timestamp: new Date(Date.now() - 7200000),
            by: createdUsers[0]._id
          },
          {
            event: "Assigned agency: SDRF Disaster Rapid Action Unit",
            timestamp: new Date(Date.now() - 7000000),
            by: createdUsers[0]._id
          },
          {
            event: "Agency response updated to 'On Scene'",
            timestamp: new Date(Date.now() - 5000000),
            by: createdUsers[3]._id
          }
        ]
      },
      {
        reportedBy: createdUsers[2]._id,
        description: "Dense chemical smoke billowing from a warehouse blaze in industrial district. Local residents reporting difficulty breathing.",
        location: { type: "Point", coordinates: [72.8450, 18.9550] },
        address: "Reay Road Industrial Area, Mumbai",
        priority: "High",
        status: "Under Review",
        aiAnalysis: {
          incidentType: "Fire & Explosion Emergency",
          severity: "High",
          estimatedVictims: "Smoke inhalation risks to surrounding neighborhood",
          suggestedResources: ["Fire & Rescue", "Ambulance", "Police"],
          reviewedByOfficer: false
        },
        timeline: [
          {
            event: "Incident reported by citizen",
            timestamp: new Date(Date.now() - 1800000),
            by: createdUsers[2]._id
          }
        ]
      }
    ];

    const createdIncidents = await Incident.create(incidentsData);
    console.log(`Created ${createdIncidents.length} Sample Incidents.`);

    console.log('\n================ SEED SUCCESSFUL ================');
    console.log('Login credentials for testing:');
    console.log('  Admin:    admin@resq.net    / password123');
    console.log('  Officer:  officer@resq.net  / password123');
    console.log('  Citizen:  citizen@resq.net  / password123');
    console.log('  Agency:   agency@resq.net   / password123');
    console.log('=================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
}

seedData();
