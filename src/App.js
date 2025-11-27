import React, { useState, useEffect, useCallback } from 'react';
import LoginScreen from './components/LoginScreen';
import GameBoard from './components/GameBoard';
import ErrorPopup from './components/ErrorPopup';
import wsService from './services/WebSocketService';
import { applyTheme, getStoredTheme } from './theme';
import './styles/global.css';

/**
 * Main App Component
 * Manages scene switching, WebSocket connection, and game state
 */
function App() {
	// UI State
	const [currentScene, setCurrentScene] = useState('login'); // 'login' or 'game'
	const [error, setError] = useState(null);
	const [theme, setTheme] = useState(getStoredTheme());

	// Game State
	const [username, setUsername] = useState('');
	const [gameData, setGameData] = useState({
		board: [],
		players: [],
		pawns: [],
		currentTurn: null
	});
	const [playerData, setPlayerData] = useState({
		balance: 0,
		ownedProperties: []
	});
	const [balanceNotification, setBalanceNotification] = useState(null);

	// Store username globally for button access
	useEffect(() => {
		window.currentUsername = username;
	}, [username]);

	/**
	 * Initialize theme on mount
	 */
	useEffect(() => {
		applyTheme(theme);
	}, [theme]);

	/**
	 * Toggle between light and dark themes
	 */
	const toggleTheme = useCallback(() => {
		const newTheme = theme === 'dark' ? 'light' : 'dark';
		setTheme(newTheme);
		applyTheme(newTheme);
	}, [theme]);

	/**
	 * Handle error messages from server
	 */
	const handleError = useCallback((data) => {
		console.error('Server error:', data);
		setError({
			code: data.code,
			message: data.message || 'An error occurred',
			onClose: () => {
				// Reset loading state in LoginScreen
				if (currentScene === 'login') {
					window.dispatchEvent(new CustomEvent('resetLoginLoading'));
				}
			}
		});
	}, [currentScene]);

	/**
	 * Handle new game creation response
	 */
	const handleNewGame = useCallback((data) => {
		console.log('Game created:', data);

		// Show lobby code to user
		alert(`Lobby created successfully!\n\nLobby Code: ${data['lobby-code']}\n\nShare this code with other players so they can join.`);

		setGameData({
			board: data.board || [],
			players: [],
			pawns: data.pawns || [],
			currentTurn: null,
			lobbyCode: data['lobby-code']
		});
		setCurrentScene('game');
	}, []);

	/**
	 * Handle successful game join
	 */
	const handleJoinGame = useCallback((data) => {
		console.log('Joined game:', data);
		setGameData({
			board: data.board || [],
			players: data.players || [],
			pawns: data.pawns || [],
			currentTurn: null
		});
		setCurrentScene('game');
	}, []);

	/**
	 * Handle new player joining
	 */
	const handleNewPlayer = useCallback((data) => {
		console.log('New player joined:', data);
		setGameData(prev => ({
			...prev,
			players: [...prev.players, data.player]
		}));
	}, []);

	/**
	 * Handle game start
	 */
	const handleGameStart = useCallback((data) => {
		console.log('Game started:', data);
		// Game start notification - could show a message
	}, []);

	/**
	 * Handle turn change
	 */
	const handleNextTurn = useCallback((data) => {
		console.log('Next turn:', data);
		setGameData(prev => ({
			...prev,
			currentTurn: data.player
		}));
	}, []);

	/**
	 * Handle player data sync
	 */
	const handlePlayerData = useCallback((data) => {
		console.log('Player data:', data);
		setPlayerData({
			balance: data.balance,
			ownedProperties: data['owned-properties'] || []
		});
	}, []);

	/**
	 * Handle transaction (balance change)
	 */
	const handleTransaction = useCallback((data) => {
		console.log('Transaction:', data);
		const change = data['balance-change'];
		
		// Show balance notification
		setBalanceNotification(change);
		setTimeout(() => setBalanceNotification(null), 1000);
		
		// Update balance
		setPlayerData(prev => ({
			...prev,
			balance: data['balance-sync']
		}));
	}, []);

	/**
	 * Handle property transfer
	 */
	const handlePropertyTransfer = useCallback((data) => {
		console.log('Property transfer:', data);
		const property = data.property;
		
		setPlayerData(prev => {
			// Check if property already owned (update) or new
			const existingIndex = prev.ownedProperties.findIndex(p => p.id === property.id);
			if (existingIndex >= 0) {
				const updated = [...prev.ownedProperties];
				updated[existingIndex] = property;
				return { ...prev, ownedProperties: updated };
			} else {
				return { ...prev, ownedProperties: [...prev.ownedProperties, property] };
			}
		});
	}, []);

	/**
	 * Handle player position update
	 */
	const handleSetPosition = useCallback((data) => {
		console.log('Position set:', data);
		// Could update player position on board
	}, []);

	/**
	 * Setup WebSocket message handlers
	 */
	useEffect(() => {
		// Register all message handlers using the extensible map system
		wsService.on('ERROR', handleError);
		wsService.on('NEW_GAME', handleNewGame);
		wsService.on('JOIN_GAME', handleJoinGame);
		wsService.on('NEW_PLAYER', handleNewPlayer);
		wsService.on('GAME_START', handleGameStart);
		wsService.on('NEXT_TURN', handleNextTurn);
		wsService.on('PLAYER_DATA', handlePlayerData);
		wsService.on('TRANSACTION', handleTransaction);
		wsService.on('PROPERTY_TRANSFER', handlePropertyTransfer);
		wsService.on('SET_POSITION', handleSetPosition);

		// Cleanup on unmount
		return () => {
			wsService.off('ERROR');
			wsService.off('NEW_GAME');
			wsService.off('JOIN_GAME');
			wsService.off('NEW_PLAYER');
			wsService.off('GAME_START');
			wsService.off('NEXT_TURN');
			wsService.off('PLAYER_DATA');
			wsService.off('TRANSACTION');
			wsService.off('PROPERTY_TRANSFER');
			wsService.off('SET_POSITION');
		};
	}, [handleError, handleNewGame, handleJoinGame, handleNewPlayer, handleGameStart, handleNextTurn, handlePlayerData, handleTransaction, handlePropertyTransfer, handleSetPosition]);

	/**
	 * Handle join button click from LoginScreen
	 */
	const handleJoinClick = useCallback(async (inputUsername, lobbyCode) => {
		try {
			setUsername(inputUsername);

			// Connect to WebSocket if not already connected
			if (!wsService.isConnected) {
				await wsService.connect();
			}

			// If no lobby code provided, create a new game
			if (!lobbyCode) {
				const success = wsService.createGame(inputUsername);
				if (!success) {
					setError({
						code: 'CONNECTION_ERROR',
						message: 'Failed to create game. Please check your connection.'
					});
				}
			} else {
				// Send join request
				const success = wsService.requestJoin(inputUsername, lobbyCode);
				if (!success) {
					setError({
						code: 'CONNECTION_ERROR',
						message: 'Failed to send join request. Please check your connection.'
					});
				}
			}
		} catch (err) {
			console.error('Join error:', err);
			setError({
				code: 'CONNECTION_ERROR',
				message: 'Failed to connect to server. Please try again.',
				onClose: () => {
					// Reset loading state in LoginScreen
					window.dispatchEvent(new CustomEvent('resetLoginLoading'));
				}
			});
		}
	}, []);

	/**
	 * Close error popup
	 */
	const handleCloseError = useCallback(() => {
		setError(null);
	}, []);

	/**
	 * Disconnect on unmount
	 */
	useEffect(() => {
		return () => {
			wsService.disconnect();
		};
	}, []);

	return (
		<div className="app">
			{/* Theme toggle button */}
			<button
				className="theme-toggle"
				onClick={toggleTheme}
				aria-label="Toggle theme"
			>
				<span className="theme-toggle-icon">
					{theme === 'dark' ? '☀️' : '🌙'}
				</span>
			</button>

			{/* Scene rendering */}
			{currentScene === 'login' && (
				<LoginScreen onJoin={handleJoinClick} />
			)}

			{currentScene === 'game' && (
				<GameBoard
					board={gameData.board}
					players={gameData.players}
					pawns={gameData.pawns}
					currentTurn={gameData.currentTurn}
					playerData={playerData}
					balanceNotification={balanceNotification}
				/>
			)}

			{/* Error popup (non-blocking) */}
			<ErrorPopup
				error={error}
				onClose={handleCloseError}
				autoCloseDelay={5000}
			/>
		</div>
	);
}

export default App;
