# 🎯 How to Restart PDF Presentation Server

## After Rebooting Your PC:

### **Method 1: Use the Startup Script (EASIEST)**
1. Open terminal
2. Go to the project folder:
   ```bash
   cd /home/csjo/a2_cursor/ver_lect
   ```
3. Run the startup script:
   ```bash
   ./start.sh
   ```

### **Method 2: Manual Command**
1. Open terminal
2. Run these commands:
   ```bash
   cd /home/csjo/a2_cursor/ver_lect
   node server.js
   ```

### **Method 3: Double-click Startup (GUI)**
1. Open file manager
2. Navigate to: `/home/csjo/a2_cursor/ver_lect`
3. Double-click `start.sh` file
4. Choose "Run in Terminal" if prompted

## 📱 Once Server is Running:

- **Main page (viewers)**: http://localhost:3000
- **Presenter (you)**: http://localhost:3000/p
- **Direct viewer**: http://localhost:3000/viewer-enhanced

## 🔄 What You'll See When It Starts:
```
🎯 PDF Presentation Server running on http://localhost:3000
👥 Main page (viewers): http://localhost:3000/
📺 Direct viewer link: http://localhost:3000/viewer-enhanced
👨‍🏫 Presenter access: http://localhost:3000/presenter-enhanced
⚡ Quick presenter: http://localhost:3000/p
```

## ❌ Troubleshooting:
- If port 3000 is busy: `pkill -f "node.*server.js"` then try again
- If Node.js not found: Make sure Node.js is installed
- If files not found: Make sure you're in the right directory

## 💡 Pro Tip:
Bookmark `http://localhost:3000/p` for quick presenter access! 