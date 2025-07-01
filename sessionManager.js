const DatabaseManager = require('./database');
const crypto = require('crypto');

function uuidv4() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  } else {
    // Fallback UUID generator for older Node.js versions
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

class DatabaseSessionManager {
  constructor(maxSessions = 50) {
    this.maxSessions = maxSessions;
    this.db = new DatabaseManager();
    
    // In-memory tracking for active connections
    this.activeConnections = new Map(); // sessionId -> { viewers: Set, presenters: Set }
  }

  async init() {
    await this.db.init();
    console.log('DatabaseSessionManager initialized - manual cleanup only');
  }

  async createSession(presenterName, pdfFile = null, creatorId = null) {
    // Check session limit
    const allSessions = await this.db.getAllSessions();
    if (allSessions.length >= this.maxSessions) {
      throw new Error(`Maximum ${this.maxSessions} sessions allowed`);
    }

    const sessionId = uuidv4();
    const sessionData = {
      id: sessionId,
      presenterName,
      pdfFile,
      creatorId
    };

    // Create session in database
    const session = await this.db.createSession(sessionData);
    
    // Initialize in-memory connection tracking
    this.activeConnections.set(sessionId, {
      viewers: new Set(),
      presenters: new Set()
    });

    console.log(`Session created: ${sessionId} by ${presenterName} (creator: ${creatorId})`);
    return session;
  }

  async getSession(sessionId) {
    const session = await this.db.getSession(sessionId);
    if (!session) {
      return null;
    }

    // Add in-memory connection data
    const connections = this.activeConnections.get(sessionId) || { viewers: new Set(), presenters: new Set() };
    session.viewers = connections.viewers;
    session.presenters = connections.presenters;

    return session;
  }

  async getAllSessions() {
    const sessions = await this.db.getAllSessions();
    
    // Add in-memory connection data and viewer counts
    return sessions.map(session => {
      const connections = this.activeConnections.get(session.id) || { viewers: new Set(), presenters: new Set() };
      session.viewers = connections.viewers;
      session.presenters = connections.presenters;
      return session;
    }); // Return all sessions (both presenting and available)
  }

  async getUserSessions(creatorId) {
    const sessions = await this.db.getUserSessions(creatorId);
    
    // Add current viewer counts from in-memory tracking
    return sessions.map(session => {
      const connections = this.activeConnections.get(session.id);
      session.viewerCount = connections ? connections.viewers.size : 0;
      return session;
    });
  }

  async canDeleteSession(sessionId, creatorId) {
    return await this.db.canDeleteSession(sessionId, creatorId);
  }

  async removeSession(sessionId) {
    // Remove from database
    await this.db.deleteSession(sessionId);
    
    // Clean up in-memory tracking
    this.activeConnections.delete(sessionId);
    
    console.log(`Session removed: ${sessionId}`);
  }

  async updateActivity(sessionId) {
    await this.db.updateSession(sessionId, {});
  }

  // Connection management (in-memory)
  async addViewer(sessionId, socketId) {
    if (!this.activeConnections.has(sessionId)) {
      this.activeConnections.set(sessionId, { viewers: new Set(), presenters: new Set() });
    }
    
    this.activeConnections.get(sessionId).viewers.add(socketId);
    await this.updateActivity(sessionId);
    
    console.log(`Viewer added to session ${sessionId}: ${socketId}`);
  }

  async addPresenter(sessionId, socketId) {
    if (!this.activeConnections.has(sessionId)) {
      this.activeConnections.set(sessionId, { viewers: new Set(), presenters: new Set() });
    }
    
    this.activeConnections.get(sessionId).presenters.add(socketId);
    
    // Mark session as presenting in database
    await this.db.updateSession(sessionId, { isPresenting: true });
    await this.updateActivity(sessionId);
    
    console.log(`Presenter added to session ${sessionId}: ${socketId}`);
  }

  async removeViewer(sessionId, socketId) {
    const connections = this.activeConnections.get(sessionId);
    if (connections) {
      const removed = connections.viewers.delete(socketId);
      if (removed) {
        console.log(`Viewer removed from session ${sessionId}: ${socketId}`);
        return true;
      }
    }
    return false;
  }

  async removePresenter(sessionId, socketId) {
    const connections = this.activeConnections.get(sessionId);
    if (connections) {
      const removed = connections.presenters.delete(socketId);
      if (removed) {
        // If no presenters left, mark session as not presenting
        if (connections.presenters.size === 0) {
          await this.db.updateSession(sessionId, { isPresenting: false });
          
          console.log(`Presenter removed from session ${sessionId}: ${socketId}`);
          return true;
        }
      }
    }
    return false;
  }

  getViewerCount(sessionId) {
    const connections = this.activeConnections.get(sessionId);
    return connections ? connections.viewers.size : 0;
  }

  getPresenterCount(sessionId) {
    const connections = this.activeConnections.get(sessionId);
    return connections ? connections.presenters.size : 0;
  }

  // Session data updates
  async updateSlide(sessionId, slideNumber) {
    await this.db.updateSession(sessionId, { currentSlide: slideNumber });
  }

  async updateTotalSlides(sessionId, totalSlides) {
    await this.db.updateSession(sessionId, { totalSlides });
  }

  async updatePdfFile(sessionId, pdfFile) {
    await this.db.updateSession(sessionId, { 
      pdfFile, 
      currentSlide: 1, 
      totalSlides: 0 
    });
  }

  async close() {
    if (this.db) {
      await this.db.close();
    }
  }
}

module.exports = DatabaseSessionManager; 