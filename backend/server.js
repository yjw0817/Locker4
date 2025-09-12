const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3333;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:3001',
    'http://localhost:8080'  // Added for CodeIgniter integration
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/lockrs', require('./routes/lockers'));
app.use('/api/zones', require('./routes/zones'));
app.use('/api/types', require('./routes/types'));
app.use('/api/members', require('./routes/members'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`
🚀 Server running on http://localhost:${PORT}
📡 API endpoints:
   - GET    /api/health         - Health check
   - GET    /api/lockrs         - Get all lockers
   - POST   /api/lockrs         - Create new locker
   - PUT    /api/lockrs/:id     - Update locker
   - DELETE /api/lockrs/:id     - Delete locker
   - POST   /api/lockrs/:id/tiers - Add tiers to locker
  `);
});