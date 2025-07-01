# 🎯 PDF Presentation Server

A powerful web-based presentation system with **enhanced annotation tools**, real-time synchronization, and professional presentation features.

## 🚀 Quick Start

Your presentation system is running with **both basic and enhanced modes**!

### 🏠 **Main Dashboard**
- Open: **http://localhost:3000/** 
- Choose from multiple presenter and viewer interfaces
- Select basic or enhanced features based on your needs

### 👨‍🏫 **For Presenters**
**Basic Presenter:** http://localhost:3000/presenter
- Projector-optimized fullscreen mode
- Smart slide fitting (width/height/page)
- Real-time audience synchronization

**Enhanced Presenter:** http://localhost:3000/presenter-enhanced ⭐ **NEW!**
- 🔴 **Laser pointer** - Virtual laser pointer visible to all viewers
- ✏️ **Drawing tools** - Draw and annotate directly on slides
- 🖍️ **Highlighter** - Highlight important content
- 🔍 **Magnifying glass** - Zoom in on specific areas
- 💡 **Spotlight mode** - Focus attention on specific areas
- 🎨 **8 color palette** with adjustable pen sizes
- 🗑️ **Clear annotations** with one click

### 👥 **For Viewers (Your Audience)**
**Basic Viewer:** http://localhost:3000/viewer
- Follow presenter or navigate independently
- Zoom and fullscreen capabilities

**Enhanced Viewer:** http://localhost:3000/viewer-enhanced ⭐ **NEW!**
- See presenter's laser pointer in real-time
- View all annotations and drawings
- Experience spotlight effects
- Real-time tool activity indicators

## 🎯 Features

### Basic Presenter Interface
- **Projector-ready fullscreen**: Dedicated fullscreen mode optimized for beam projectors
- **Smart fit modes**: Auto-fit slides to width, height, or entire screen
- **Zoom controls**: Manual zoom from 25% to 500% for detailed content
- **Auto-sizing**: Slides automatically scale for optimal projector display
- **Real-time control**: Navigate slides with Previous/Next buttons or arrow keys
- **Audience monitoring**: See how many viewers are connected
- **Connection status**: Visual indicator of server connection
- **Fullscreen controls**: Auto-hiding navigation controls in presentation mode

### ⭐ Enhanced Presenter Tools
- **🔴 Laser Pointer**: Virtual red dot that follows your mouse, synchronized with viewers
- **✏️ Drawing Tools**: Freehand drawing with customizable pen sizes (1-20px)
- **🖍️ Highlighter**: Semi-transparent highlighting for emphasizing content
- **🔍 Magnifying Glass**: Real-time magnification of specific slide areas (50-300px)
- **💡 Spotlight Mode**: Darken slide except for illuminated area around cursor
- **🎨 Color Palette**: 8 colors (red, green, blue, yellow, magenta, cyan, white, black)
- **📏 Size Controls**: Adjustable pen thickness and magnifier size
- **🗑️ Clear All**: Instantly remove all annotations and reset tools
- **⚡ Real-time Sync**: All tools synchronized live with enhanced viewers

### Keyboard Shortcuts

**Basic Presenter:**
- **F**: Toggle fullscreen mode (perfect for projectors)
- **1**: Fit slide to width
- **2**: Fit slide to height  
- **3**: Fit entire slide to screen
- **+/=**: Zoom in
- **-**: Zoom out
- **Arrow keys/Space**: Navigate slides
- **ESC**: Exit fullscreen

**Enhanced Presenter:**
- **1**: Pointer tool (default)
- **2**: Laser pointer
- **3**: Drawing pen
- **4**: Highlighter
- **5**: Magnifying glass
- **6**: Spotlight mode
- **C**: Clear all annotations
- **Arrow keys/Space**: Navigate slides

### Viewer Keyboard Shortcuts
- **+/=**: Zoom in
- **-**: Zoom out  
- **0**: Reset zoom to 100%
- **F**: Toggle fullscreen mode
- **ESC**: Exit fullscreen
- **Arrow keys/Space**: Navigate slides (when not following presenter)
- **Mouse drag**: Pan when zoomed in

### Viewer Interface
- **Follow Presenter toggle**: Choose to follow presenter or navigate independently
- **Independent navigation**: When toggled off, use your own navigation controls
- **Zoom controls**: Zoom in/out with +/- buttons (25% to 300% range)
- **Fullscreen mode**: Dedicated fullscreen button with auto-hiding controls
- **Pan support**: Drag to pan when zoomed in beyond 100%
- **Real-time updates**: Instantly receive slide changes from presenter
- **Responsive design**: Works on desktop, tablet, and mobile devices

## 🔧 Technical Details

- **Frontend**: HTML5, PDF.js for PDF rendering, Socket.IO for real-time communication
- **Backend**: Node.js, Express, Socket.IO
- **PDF file**: `docs/Verilog_Basic.pdf` (automatically served)
- **Real-time features**: WebSocket-based synchronization for all presentation tools

## 📱 Usage Tips

1. **For best experience**: Use Chrome, Firefox, or Safari
2. **Network sharing**: Other devices on your network can access the presentation using your IP address (e.g., http://192.168.1.100:3000/)
3. **Presenter controls**: Always use the presenter interface to control slides for viewers
4. **Viewer independence**: Viewers can disable following to browse slides at their own pace
5. **Zoom for readability**: Viewers can zoom in up to 300% for better text readability
6. **Fullscreen presentations**: Use F key or fullscreen button for immersive viewing
7. **Pan zoomed content**: When zoomed in, drag the slide to see different areas
8. **Projector optimization**: Presenter fullscreen mode auto-fits slides for best projector display
9. **Smart scaling**: Choose "Fit Width" for wide screens or "Fit Height" for standard projectors
10. **Quick controls**: In fullscreen, move mouse to show/hide controls
11. **⭐ Enhanced tools**: Use laser pointer for emphasis, drawing for explanations, magnifier for details
12. **⭐ Annotation colors**: Switch between 8 colors for different types of annotations
13. **⭐ Spotlight mode**: Perfect for focusing attention on specific slide areas

## 🛠 Commands

```bash
# Start the server
npm start

# Stop the server
Ctrl+C in the terminal where it's running

# Install dependencies (if needed)
npm install
```

## 🌐 Network Access

To allow other devices on your network to connect:
1. Find your computer's IP address: `ip addr show` (Linux) or `ipconfig` (Windows)
2. Share the URL: `http://YOUR_IP_ADDRESS:3000/` with viewers
3. Make sure your firewall allows connections on port 3000

## 📋 Current Status

✅ Server running on http://localhost:3000  
✅ PDF loaded: Verilog_Basic.pdf  
✅ Real-time synchronization active  
✅ ⭐ Enhanced annotation tools available  
✅ Ready for presentations! 