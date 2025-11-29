/**
 * WebSocket Service for Monopoly Online
 * Handles all server communication with extensible message handler map
 */

import config from '../config';

class WebSocketService {
	constructor() {
		this.ws = null;
		this.messageHandlers = new Map();
		this.isConnected = false;
		this.reconnectAttempts = 0;
		this.reconnectTimer = null;
	}

	/**
	 * Connect to WebSocket server
	 * @returns {Promise<void>}
	 */
	connect() {
		return new Promise((resolve, reject) => {
			try {
				this.ws = new WebSocket(config.server.url);

				this.ws.onopen = () => {
					console.log('WebSocket connected');
					this.isConnected = true;
					this.reconnectAttempts = 0;
					resolve();
				};

				this.ws.onmessage = (event) => {
					// Support text and Blob payloads; ensure UTF-8 decoding for binary blobs
					if (typeof event.data === 'string') {
						this.handleMessage(event.data);
					} else if (event.data instanceof Blob) {
						// Read blob as UTF-8 text
						event.data.text().then(text => {
							this.handleMessage(text);
						}).catch(err => {
							console.error('Error reading message blob as text:', err);
						});
					} else if (event.data instanceof ArrayBuffer) {
						try {
							const decoder = new TextDecoder('utf-8');
							const text = decoder.decode(new Uint8Array(event.data));
							this.handleMessage(text);
						} catch (err) {
							console.error('Error decoding ArrayBuffer message:', err);
						}
					} else {
						// Fallback: attempt to stringify
						try {
							this.handleMessage(String(event.data));
						} catch (err) {
							console.error('Unknown message data type:', err);
						}
					}
				};

				this.ws.onerror = (error) => {
					console.error('WebSocket error:', error);
					reject(error);
				};

				this.ws.onclose = () => {
					console.log('WebSocket disconnected');
					this.isConnected = false;
					this.attemptReconnect();
				};
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * Attempt to reconnect to server
	 */
	attemptReconnect() {
		if (this.reconnectAttempts >= config.server.maxReconnectAttempts) {
			console.error('Max reconnection attempts reached');
			return;
		}

		this.reconnectAttempts++;
		console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);

		this.reconnectTimer = setTimeout(() => {
			this.connect().catch(err => {
				console.error('Reconnection failed:', err);
			});
		}, config.server.reconnectInterval);
	}

	/**
	 * Handle incoming WebSocket message
	 * @param {string} data - Raw message data
	 */
	handleMessage(data) {
		try {
			const message = JSON.parse(data);
			const messageType = message.type;

			if (this.messageHandlers.has(messageType)) {
				const handler = this.messageHandlers.get(messageType);
				handler(message.data || message);
			} else {
				console.warn(`No handler registered for message type: ${messageType}`);
			}
		} catch (error) {
			console.error('Error parsing message:', error);
		}
	}

	/**
	 * Register a message handler for a specific message type
	 * @param {string} messageType - Message type to handle
	 * @param {Function} handler - Handler function to execute
	 */
	on(messageType, handler) {
		if (typeof handler !== 'function') {
			throw new Error('Handler must be a function');
		}
		this.messageHandlers.set(messageType, handler);
	}

	/**
	 * Unregister a message handler
	 * @param {string} messageType - Message type to remove
	 */
	off(messageType) {
		this.messageHandlers.delete(messageType);
	}

	/**
	 * Send a message to the server
	 * @param {string} type - Message type
	 * @param {Object} data - Message data
	 * @returns {boolean} - Success status
	 */
	send(type, data = {}) {
		if (!this.isConnected || !this.ws) {
			console.error('WebSocket is not connected');
			return false;
		}

		try {
			const message = {
				type,
				data
			};
			this.ws.send(JSON.stringify(message));
			return true;
		} catch (error) {
			console.error('Error sending message:', error);
			return false;
		}
	}

	/**
	 * Send REQUEST_JOIN message
	 * @param {string} username - Player username
	 * @param {string} lobbyCode - 6-digit lobby code
	 */
	requestJoin(username, lobbyCode) {
		return this.send('REQUEST_JOIN', {
			username,
			lobby: lobbyCode
		});
	}

	/**
	 * Send GAME_CREATE message
	 * @param {string} username - Host username
	 */
	createGame(username) {
		return this.send('GAME_CREATE', {
			username
		});
	}

	/**
	 * Send GAME_START message
	 */
	startGame() {
		return this.send('GAME_START', {});
	}

	/**
	 * Send FINISH_TURN message
	 * @param {string} username - Current player username
	 */
	finishTurn(username) {
		return this.send('FINISH_TURN', {
			player: username
		});
	}

	/**
	 * Send REQUEST_ROLL message
	 */
	requestRoll() {
		return this.send('REQUEST_ROLL', {});
	}

	/**
	 * Send CHOICE_RESPONSE message
	 * @param {string} label - Selected choice label
	 */
	sendChoice(label) {
		return this.send('CHOICE_RESPONSE', {
			label
		});
	}

	/**
	 * Disconnect from server
	 */
	disconnect() {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
		}

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		this.isConnected = false;
		this.messageHandlers.clear();
	}
}

// Export singleton instance
const wsService = new WebSocketService();
export default wsService;
