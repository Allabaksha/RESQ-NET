const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS allowlist. Add your deployed frontend origin (e.g. Vercel URL) to the
// CORS_ORIGINS env var as a comma-separated list. Dev origins are the default.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser requests (curl, health checks) and allowlisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
};

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: corsOptions
});

// Attach socket.io instance to app for routes access
app.set('io', io);
socketHandler(io);

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect Database
connectDB();

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/agencies', require('./routes/agencyRoutes'));
app.use('/api/incidents', require('./routes/incidentRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    app: 'RESQ-NET API', 
    timestamp: new Date().toISOString() 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  RESQ-NET Backend Server running on port ${PORT} `);
  console.log(`  Socket.IO active | MongoDB 2dsphere indexing ready  `);
  console.log(`=======================================================`);
});
