const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs-extra');
const DatabaseSessionManager = require('./sessionManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuration
const MAX_SESSIONS = 50;
const UPLOAD_DIR = 'uploads';

// Ensure upload directory exists
fs.ensureDirSync(UPLOAD_DIR);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const sessionId = req.body.sessionId || require('crypto').randomUUID();
    const timestamp = Date.now();
    cb(null, `${sessionId}_${timestamp}_${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/docs', express.static('docs'));
app.use('/uploads', express.static(UPLOAD_DIR));

// Session management with database
const sessionManager = new DatabaseSessionManager(MAX_SESSIONS);

// Routes

// Serve main interface selection page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Session selection page for viewers
app.get('/sessions', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'session-selector.html'));
});

// Session management page for presenters
app.get('/manage', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'session-manager.html'));
});

// Presenter interface
app.get('/presenter', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'presenter-upload.html'));
});

// Presenter enhanced interface with session
app.get('/presenter/:sessionId', async (req, res) => {
  try {
    const session = await sessionManager.getSession(req.params.sessionId);
    if (!session) {
      return res.status(404).send('Session not found');
    }
    res.sendFile(path.join(__dirname, 'public', 'presenter-enhanced.html'));
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).send('Internal server error');
  }
});

// Viewer interface for specific session
app.get('/viewer/:sessionId', async (req, res) => {
  try {
    const session = await sessionManager.getSession(req.params.sessionId);
    if (!session) {
      return res.status(404).send('Session not found');
    }
    res.sendFile(path.join(__dirname, 'public', 'viewer-enhanced.html'));
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).send('Internal server error');
  }
});

// Legacy routes (redirect to new system)
app.get('/presenter-enhanced', (req, res) => {
  res.redirect('/presenter');
});

app.get('/viewer-enhanced', (req, res) => {
  res.redirect('/sessions');
});

app.get('/p', (req, res) => {
  res.redirect('/presenter');
});

app.get('/viewer', (req, res) => {
  res.redirect('/sessions');
});

// Debug route to help users check their user ID
app.get('/debug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'debug-user-id.html'));
});

// API Routes

// Create a new presentation session
app.post('/api/sessions', async (req, res) => {
  try {
    const { presenterName, creatorId } = req.body;
    if (!presenterName) {
      return res.status(400).json({ error: 'Presenter name is required' });
    }

    const session = await sessionManager.createSession(presenterName, null, creatorId);
    res.json({ 
      sessionId: session.id,
      presenterUrl: `/presenter/${session.id}`,
      viewerUrl: `/viewer/${session.id}`
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Upload PDF for session
app.post('/api/sessions/:sessionId/upload', upload.single('pdf'), async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const session = await sessionManager.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Clean up old PDF file if it exists
    if (session.pdfFile) {
      try {
        fs.unlinkSync(path.join(UPLOAD_DIR, session.pdfFile));
        console.log(`Removed old PDF file: ${session.pdfFile}`);
      } catch (err) {
        console.error('Error removing old PDF file:', err);
      }
    }

    // Update session with new PDF file
    await sessionManager.updatePdfFile(sessionId, req.file.filename);

    console.log(`PDF uploaded for session ${sessionId}: ${req.file.filename}`);

    // Broadcast PDF change to all connected viewers and presenters
    io.to(`viewers-${sessionId}`).to(`presenters-${sessionId}`).emit('pdf-changed', {
      pdfFile: req.file.filename,
      currentSlide: 1,
      totalSlides: 0,
      sessionId: sessionId
    });

    res.json({ 
      message: 'PDF uploaded successfully',
      filename: req.file.filename,
      presenterUrl: `/presenter/${sessionId}`
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all active sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await sessionManager.getAllSessions();
    const sessionData = sessions.map(session => ({
      id: session.id,
      presenterName: session.presenterName,
      viewerCount: sessionManager.getViewerCount(session.id),
      currentSlide: session.currentSlide,
      totalSlides: session.totalSlides,
      isPresenting: session.isPresenting,
      createdAt: session.createdAt
    }));
    res.json(sessionData);
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session details
app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const session = await sessionManager.getSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      id: session.id,
      presenterName: session.presenterName,
      pdfFile: session.pdfFile,
      currentSlide: session.currentSlide,
      totalSlides: session.totalSlides,
      isPresenting: session.isPresenting,
      viewerCount: sessionManager.getViewerCount(session.id),
      creatorId: session.creatorId
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sessions created by a specific user
app.get('/api/my-sessions', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    let sessions;
    // If authenticated presenter, show ALL sessions
    if (userId === 'presenter_admin') {
      sessions = await sessionManager.getAllSessions();
      // Add viewerCount from in-memory tracking
      const sessionData = sessions.map(session => ({
        id: session.id,
        presenterName: session.presenterName,
        pdfFile: session.pdfFile,
        currentSlide: session.currentSlide,
        totalSlides: session.totalSlides,
        isPresenting: session.isPresenting,
        viewerCount: sessionManager.getViewerCount(session.id),
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      }));
      res.json(sessionData);
    } else {
      // Regular user sessions
      sessions = await sessionManager.getUserSessions(userId);
      res.json(sessions);
    }
  } catch (error) {
    console.error('Error getting user sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a session (only creator can delete)
app.delete('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Authenticated presenter can delete any session
    let canDelete;
    if (userId === 'presenter_admin') {
      canDelete = true;  // Admin can delete any session
    } else {
      canDelete = await sessionManager.canDeleteSession(sessionId, userId);
    }

    if (!canDelete) {
      return res.status(403).json({ error: 'You can only delete sessions you created' });
    }

    // Notify all clients that session is ending
    io.to(`session-${sessionId}`).emit('session-ended', { sessionId });
    
    await sessionManager.removeSession(sessionId);
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(400).json({ error: error.message });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  let currentSession = null;

  // Function to broadcast viewer count to presenters in a session
  async function broadcastViewerCount(sessionId) {
    try {
      const session = await sessionManager.getSession(sessionId);
      if (session) {
        const viewerCount = sessionManager.getViewerCount(sessionId);
        io.to(`presenters-${sessionId}`).emit('viewer-count-update', { count: viewerCount });
      }
    } catch (error) {
      console.error('Error broadcasting viewer count:', error);
    }
  }

  // Handle presenter joining a session
  socket.on('join-presenter', async (data) => {
    try {
      const { sessionId } = data;
      const session = await sessionManager.getSession(sessionId);
      
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      currentSession = sessionId;
      socket.join(`presenters-${sessionId}`);
      await sessionManager.addPresenter(sessionId, socket.id);
      
      console.log(`Presenter joined session ${sessionId}:`, socket.id);
      
      // Send current session state and viewer count
      socket.emit('session-state', {
        currentSlide: session.currentSlide,
        totalSlides: session.totalSlides,
        pdfFile: session.pdfFile
      });
      socket.emit('viewer-count-update', { count: sessionManager.getViewerCount(sessionId) });
    } catch (error) {
      console.error('Error joining presenter:', error);
      socket.emit('error', { message: 'Error joining session' });
    }
  });

  // Handle viewer joining a session
  socket.on('join-viewer', async (data) => {
    try {
      const { sessionId } = data;
      const session = await sessionManager.getSession(sessionId);
      
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      currentSession = sessionId;
      socket.join(`viewers-${sessionId}`);
      await sessionManager.addViewer(sessionId, socket.id);
      
      console.log(`Viewer joined session ${sessionId}:`, socket.id);
      
      // Send current session state
      socket.emit('session-state', {
        currentSlide: session.currentSlide,
        totalSlides: session.totalSlides,
        pdfFile: session.pdfFile
      });
      
      // Broadcast updated viewer count to presenters
      await broadcastViewerCount(sessionId);
    } catch (error) {
      console.error('Error joining viewer:', error);
      socket.emit('error', { message: 'Error joining session' });
    }
  });

  // Handle slide changes from presenter
  socket.on('slide-change', async (data) => {
    if (!currentSession) return;
    
    try {
      const session = await sessionManager.getSession(currentSession);
      if (!session) return;

      await sessionManager.updateSlide(currentSession, data.slideNumber);
      
      // Broadcast to all viewers in this session
      socket.to(`viewers-${currentSession}`).emit('slide-changed', {
        slideNumber: data.slideNumber,
        fromPresenter: true
      });
      console.log(`Session ${currentSession} - Slide changed to: ${data.slideNumber}`);
    } catch (error) {
      console.error('Error updating slide:', error);
    }
  });

  // Handle total slides update
  socket.on('total-slides', async (data) => {
    if (!currentSession) return;
    
    try {
      const session = await sessionManager.getSession(currentSession);
      if (!session) return;

      await sessionManager.updateTotalSlides(currentSession, data.total);
      
      io.to(`viewers-${currentSession}`).to(`presenters-${currentSession}`).emit('total-slides-updated', { total: data.total });
    } catch (error) {
      console.error('Error updating total slides:', error);
    }
  });

  // Handle laser pointer updates
  socket.on('laser-pointer', (data) => {
    if (!currentSession) return;
    socket.to(`viewers-${currentSession}`).emit('laser-pointer-update', data);
  });

  // Handle annotation updates
  socket.on('annotation', (data) => {
    if (!currentSession) return;
    socket.to(`viewers-${currentSession}`).emit('annotation-update', data);
  });

  // Handle spotlight updates
  socket.on('spotlight', (data) => {
    if (!currentSession) return;
    socket.to(`viewers-${currentSession}`).emit('spotlight-update', data);
  });

  // Handle magnifier updates
  socket.on('magnifier', (data) => {
    if (!currentSession) return;
    socket.to(`viewers-${currentSession}`).emit('magnifier-update', data);
  });

  // Handle clear annotations
  socket.on('clear-annotations', () => {
    if (!currentSession) return;
    socket.to(`viewers-${currentSession}`).emit('clear-annotations');
  });

  // Handle request for current session state
  socket.on('request-current-state', async () => {
    if (!currentSession) return;
    
    try {
      const session = await sessionManager.getSession(currentSession);
      if (!session) return;

      socket.emit('session-state', {
        currentSlide: session.currentSlide,
        totalSlides: session.totalSlides,
        pdfFile: session.pdfFile
      });
    } catch (error) {
      console.error('Error getting current state:', error);
    }
  });

  // Handle explicit request for session state (used during presenter restoration)
  socket.on('get-session-state', async (data) => {
    try {
      const { sessionId } = data;
      const session = await sessionManager.getSession(sessionId);
      
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      socket.emit('session-state', {
        currentSlide: session.currentSlide,
        totalSlides: session.totalSlides,
        pdfFile: session.pdfFile
      });
    } catch (error) {
      console.error('Error getting session state:', error);
      socket.emit('error', { message: 'Error getting session state' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    if (currentSession) {
      try {
        // Remove from tracking sets
        const wasViewer = await sessionManager.removeViewer(currentSession, socket.id);
        const wasPresenter = await sessionManager.removePresenter(currentSession, socket.id);
        
        // If a viewer disconnected, broadcast updated count to presenters
        if (wasViewer) {
          await broadcastViewerCount(currentSession);
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    }
  });
});

// Server startup
async function startServer() {
  try {
    // Initialize database
    await sessionManager.init();
    
    // Start server
    const port = process.env.PORT || 3002;
    server.listen(port, () => {
      console.log(`🚀 PDF Presentation System running on port ${port}`);
      console.log(`📁 Upload directory: ${UPLOAD_DIR}`);
      console.log(`🗂️  Database file: ${path.join(__dirname, 'presentation_system.db')}`);
      console.log(`📊 Max sessions: ${MAX_SESSIONS}`);
      console.log(`🔧 Features:`);
      console.log(`  • Session management with SQLite database`);
      console.log(`  • Real-time WebSocket communication`);
      console.log(`  • File upload with cleanup`);
      console.log(`  • Cross-device session sharing`);
      console.log(`  • Presenter authentication system`);
      console.log(`  • Manual session management only`);
      console.log(`\n🌐 Access URLs:`);
      console.log(`  • Home: http://localhost:${port}/`);
      console.log(`  • Create Session: http://localhost:${port}/presenter`);
      console.log(`  • Join Session: http://localhost:${port}/sessions`);
      console.log(`  • Manage Sessions: http://localhost:${port}/manage (password: 70998)`);
      console.log(`\n🔧 Session Management:`);
      console.log(`  • Sessions are never automatically deleted`);
      console.log(`  • Use the Manage interface to delete sessions manually`);
      console.log(`  • Presenter admin can delete any session`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  await sessionManager.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down server...');
  await sessionManager.close();
  process.exit(0);
});

startServer(); 