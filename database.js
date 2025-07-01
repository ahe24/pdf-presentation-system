const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

class DatabaseManager {
    constructor(dbPath = 'presentation_system.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database:', this.dbPath);
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            // Create sessions table
            const createSessionsTable = `
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    presenter_name TEXT NOT NULL,
                    pdf_file TEXT,
                    current_slide INTEGER DEFAULT 1,
                    total_slides INTEGER DEFAULT 0,
                    is_presenting BOOLEAN DEFAULT 0,
                    viewer_count INTEGER DEFAULT 0,
                    creator_id TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Create files table for better file management
            const createFilesTable = `
                CREATE TABLE IF NOT EXISTS files (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    original_name TEXT NOT NULL,
                    file_size INTEGER,
                    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
                )
            `;

            this.db.serialize(() => {
                this.db.run(createSessionsTable);
                this.db.run(createFilesTable, (err) => {
                    if (err) {
                        console.error('Error creating tables:', err);
                        reject(err);
                    } else {
                        console.log('Database tables initialized successfully');
                        resolve();
                    }
                });
            });
        });
    }

    // Session Management Methods
    async createSession(sessionData) {
        const { id, presenterName, pdfFile = null, creatorId = null } = sessionData;
        
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO sessions (id, presenter_name, pdf_file, creator_id, created_at, last_activity)
                VALUES (?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
            `;
            
            this.db.run(sql, [id, presenterName, pdfFile, creatorId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    // Return object with Seoul local time
                    const now = new Date();
                    resolve({
                        id,
                        presenterName,
                        pdfFile,
                        currentSlide: 1,
                        totalSlides: 0,
                        isPresenting: false,
                        viewers: new Set(), // Will be managed in-memory for active connections
                        presenters: new Set(),
                        createdAt: now,
                        lastActivity: now,
                        creatorId
                    });
                }
            });
        });
    }

    async getSession(sessionId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM sessions WHERE id = ?
            `;
            
            this.db.get(sql, [sessionId], (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve(null);
                } else {
                    // Convert database row to session object
                    resolve({
                        id: row.id,
                        presenterName: row.presenter_name,
                        pdfFile: row.pdf_file,
                        currentSlide: row.current_slide,
                        totalSlides: row.total_slides,
                        isPresenting: Boolean(row.is_presenting),
                        viewers: new Set(), // Active connections managed in-memory
                        presenters: new Set(),
                        createdAt: new Date(row.created_at),
                        lastActivity: new Date(row.last_activity),
                        creatorId: row.creator_id
                    });
                }
            });
        });
    }

    async getAllSessions() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM sessions 
                ORDER BY last_activity DESC
            `;
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const sessions = rows.map(row => ({
                        id: row.id,
                        presenterName: row.presenter_name,
                        pdfFile: row.pdf_file,
                        currentSlide: row.current_slide,
                        totalSlides: row.total_slides,
                        isPresenting: Boolean(row.is_presenting),
                        viewers: new Set(),
                        presenters: new Set(),
                        createdAt: new Date(row.created_at),
                        lastActivity: new Date(row.last_activity),
                        creatorId: row.creator_id
                    }));
                    resolve(sessions);
                }
            });
        });
    }

    async getUserSessions(creatorId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM sessions 
                WHERE creator_id = ? OR creator_id IS NULL
                ORDER BY last_activity DESC
            `;
            
            this.db.all(sql, [creatorId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const sessions = rows.map(row => ({
                        id: row.id,
                        presenterName: row.presenter_name,
                        pdfFile: row.pdf_file,
                        currentSlide: row.current_slide,
                        totalSlides: row.total_slides,
                        isPresenting: Boolean(row.is_presenting),
                        viewerCount: 0, // Will be updated from in-memory tracking
                        createdAt: new Date(row.created_at),
                        lastActivity: new Date(row.last_activity)
                    }));
                    resolve(sessions);
                }
            });
        });
    }

    async updateSession(sessionId, updates) {
        return new Promise((resolve, reject) => {
            const fields = [];
            const values = [];
            
            if (updates.currentSlide !== undefined) {
                fields.push('current_slide = ?');
                values.push(updates.currentSlide);
            }
            if (updates.totalSlides !== undefined) {
                fields.push('total_slides = ?');
                values.push(updates.totalSlides);
            }
            if (updates.pdfFile !== undefined) {
                fields.push('pdf_file = ?');
                values.push(updates.pdfFile);
            }
            if (updates.isPresenting !== undefined) {
                fields.push('is_presenting = ?');
                values.push(updates.isPresenting ? 1 : 0);
            }
            
            // Always update last_activity
            fields.push('last_activity = datetime(\'now\', \'localtime\')');
            values.push(sessionId);

            const sql = `
                UPDATE sessions 
                SET ${fields.join(', ')}
                WHERE id = ?
            `;

            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    async deleteSession(sessionId) {
        return new Promise((resolve, reject) => {
            // First get the session to check for files
            this.getSession(sessionId).then(session => {
                if (session && session.pdfFile) {
                    // Clean up PDF file
                    try {
                        fs.unlinkSync(path.join('uploads', session.pdfFile));
                        console.log(`Removed PDF file: ${session.pdfFile}`);
                    } catch (err) {
                        console.error('Error removing PDF file:', err);
                    }
                }

                // Delete from database
                const sql = 'DELETE FROM sessions WHERE id = ?';
                this.db.run(sql, [sessionId], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`Session deleted: ${sessionId}`);
                        resolve(this.changes > 0);
                    }
                });
            }).catch(reject);
        });
    }

    async canDeleteSession(sessionId, creatorId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT creator_id FROM sessions WHERE id = ?';
            this.db.get(sql, [sessionId], (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve(false);
                } else {
                    // Allow deletion if user created it OR if it's a legacy session without creatorId
                    resolve(row.creator_id === creatorId || !row.creator_id);
                }
            });
        });
    }

    async close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                    } else {
                        console.log('Database connection closed');
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = DatabaseManager; 