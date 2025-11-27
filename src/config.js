/**
 * Configuration file for Monopoly Online Client
 */

const config = {
	// WebSocket server configuration
	server: {
		url: 'ws://localhost:8080', // Change this to your server URL
		reconnectInterval: 3000,
		maxReconnectAttempts: 5
	},

	// Game configuration
	game: {
		lobbyCodeLength: 6,
		maxPlayers: 8
	}
};

export default config;
