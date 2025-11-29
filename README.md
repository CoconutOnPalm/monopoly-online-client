# Monopoly Online - React Client

A modern React-based client for playing Monopoly online with friends.

## Features

- 🎮 **Modern UI**: Clean, responsive design with dark/light theme support
- 🔌 **WebSocket Communication**: Real-time game updates
- 🎨 **Extensible Architecture**: Easy to add new message types and features
- 📱 **Responsive**: Works on desktop, tablet, and mobile devices
- ⚡ **Error Handling**: Non-blocking error popups with auto-dismiss
- 🎯 **Type-safe Communication**: Structured protocol implementation

## Project Structure

```
client/
├── public/
│   └── index.html              # HTML entry point
├── src/
│   ├── components/
│   │   ├── LoginScreen.js      # Login screen with username/lobby code input
│   │   ├── LoginScreen.css     # Login screen styles
│   │   ├── GameBoard.js        # Game board display
│   │   ├── GameBoard.css       # Game board styles
│   │   ├── ErrorPopup.js       # Error notification component
│   │   └── ErrorPopup.css      # Error popup styles
│   ├── services/
│   │   └── WebSocketService.js # WebSocket communication handler
│   ├── styles/
│   │   └── global.css          # Global styles and theme variables
│   ├── App.js                  # Main application component
│   ├── config.js               # Configuration (server URL, etc.)
│   ├── theme.js                # Theme management
│   └── index.js                # React entry point
├── package.json                # Dependencies and scripts
└── webpack.config.js           # Build configuration
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

### Configuration

Edit `src/config.js` to set your WebSocket server URL:

```javascript
const config = {
  server: {
    url: 'ws://localhost:8080', // Change this to your server URL
    reconnectInterval: 3000,
    maxReconnectAttempts: 5
  }
};
```

### Running the Application

#### Development Mode
```bash
npm start
```
This will start the development server at `http://localhost:3000` with hot reloading enabled.

#### Production Build
```bash
npm run build
```
This will create an optimized production build in the `dist/` directory.

## How to Use

1. **Start the application**: Run `npm start` to launch the client
2. **Enter username**: Type your desired username (2-20 characters)
3. **Enter lobby code**: Input the 6-digit lobby code provided by the game host
4. **Join game**: Click "Join Game" to connect to the game
5. **Play**: The board will appear once you successfully join

## Theme Support

The application supports both dark and light themes. Click the theme toggle button (☀️/🌙) in the top-right corner to switch between themes. Your preference is saved in local storage.

### Dark Mode (Default)
- Rich dark backgrounds for comfortable viewing
- High contrast for readability
- Optimized for extended play sessions

### Light Mode
- Bright, clean interface
- Great for well-lit environments
- Classic look and feel

## WebSocket Protocol

The client implements the communication protocol defined in `monopoly-online-shared/comm-protocol.md`. All messages follow this structure:

```json
{
  "type": "MESSAGE_TYPE",
  "data": { /* message data */ }
}
```

### Supported Message Types

- `REQUEST_JOIN`: Join a game lobby
- `JOIN_GAME`: Successful join confirmation
- `NEW_PLAYER`: New player joined notification
- `GAME_START`: Game started notification
- `NEXT_TURN`: Turn change notification
- `ERROR`: Error messages from server

### Adding New Message Handlers

The WebSocket service uses an extensible message handler map. To add a new message type:

```javascript
// In App.js or any component
wsService.on('NEW_MESSAGE_TYPE', (data) => {
  // Handle the message
  console.log('Received:', data);
});
```

## Architecture

### Component Hierarchy
```
App
├── ThemeToggle
├── LoginScreen (scene)
│   └── Form (username, lobby code, join button)
├── GameBoard (scene)
│   ├── Board Layout
│   │   ├── Top Row Tiles
│   │   ├── Right Column Tiles
│   │   ├── Bottom Row Tiles
│   │   └── Left Column Tiles
│   └── Center Info Panel
│       └── Players List
└── ErrorPopup (overlay)
```

### State Management
- **Scene State**: Managed in `App.js` to switch between login and game
- **Game State**: Board data, players, and turn information
- **WebSocket State**: Connection status and message handling
- **Theme State**: Persisted in localStorage

### Extensibility

The application is designed to be easily extended:

1. **New Components**: Add to `src/components/`
2. **New Services**: Add to `src/services/`
3. **New Message Types**: Register in `App.js` using `wsService.on()`
4. **New Styles**: Add CSS files alongside components or extend `global.css`

## Error Handling

Errors are displayed as non-blocking popups that:
- Auto-dismiss after 5 seconds
- Can be manually dismissed
- Don't interrupt gameplay
- Show error codes and messages

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development Tips

### Hot Reloading
Changes to JavaScript and CSS files will automatically reload in the browser during development.

### Debugging
- Open browser DevTools (F12)
- Check Console tab for WebSocket messages and errors
- Use React DevTools extension for component inspection

### Code Style
- Use functional components with hooks
- Keep components focused and single-purpose
- Document complex functions with JSDoc comments
- Use meaningful variable and function names

## Troubleshooting

### Connection Issues
- Verify the WebSocket server URL in `config.js`
- Check that the server is running
- Look for CORS or firewall issues

### Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear webpack cache: `rm -rf dist`

## Future Enhancements

Potential features to add:
- [ ] Game lobby creation from client
- [ ] Player avatars/customization
- [ ] Chat functionality
- [ ] Game history/statistics
- [ ] Sound effects
- [ ] Animations for player movements
- [ ] Property trading interface
- [ ] In-game notifications

## License

MIT
