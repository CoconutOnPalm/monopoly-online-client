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
    const [gameNotification, setGameNotification] = useState(null);
    const [choicePrompt, setChoicePrompt] = useState(null);
    const [tileMessage, setTileMessage] = useState(null);
    // Track player positions on board (username -> position)
    const [playerPositions, setPlayerPositions] = useState({});
    const [isHost, setIsHost] = useState(false);

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

        // Mark as host
        setIsHost(true);

        // Initialize host at position 0
        if (username) {
            setPlayerPositions({ [username]: 0 });
        }

        setCurrentScene('game');
    }, [username]);

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

        // Not the host when joining
        setIsHost(false);

        // Initialize all existing players at position 0
        const positions = {};
        (data.players || []).forEach(player => {
            positions[player.username] = 0;
        });
        setPlayerPositions(positions);

        setCurrentScene('game');
    }, []);

    /**
     * Handle new player joining
     */
    const handleNewPlayer = useCallback((data) => {
        console.log('New player joined:', data);
        const player = data.player;
        setGameData(prev => ({
            ...prev,
            players: [...prev.players, player]
        }));

        // Initialize new player at position 0
        setPlayerPositions(prev => ({
            ...prev,
            [player.username]: 0
        }));
    }, []);

    /**
     * Handle game start
     */
    const handleGameStart = useCallback((data) => {
        console.log('Game started:', data);

        // Show game started notification
        setGameNotification({ type: 'info', message: 'Game Started!' });
        setTimeout(() => setGameNotification(null), 3000);

        // Initialize all players at position 0 (start)
        setGameData(prev => {
            const positions = {};
            prev.players.forEach(player => {
                positions[player.username] = 0;
            });
            setPlayerPositions(positions);
            return prev;
        });
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

        // Show notification if it's this player's turn
        if (data.player === username) {
            setGameNotification({ type: 'info', message: 'Your Turn!' });
            setTimeout(() => setGameNotification(null), 3000);
        }
    }, [username]);

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
     * Handle CHOICE messages from server
     * Expected format: { OPTIONS: [ { label, description } ], title?: string }
     */
    const handleChoice = useCallback((data) => {
        console.log('CHOICE received:', data);
        const payload = data || {};
        const options = payload.OPTIONS || payload.options || [];
        const title = payload.title || 'Choose an option';
        setChoicePrompt({ title, options });
    }, []);

    /**
     * Handle TILE_MESSAGE from server (chance/community chest)
     * Expected format: { title: string, message: string }
     */
    const handleTileMessage = useCallback((data) => {
        console.log('TILE_MESSAGE received:', data);
        const payload = data || {};
        // Accept nested data or direct
        const msg = payload.data || payload;
        setTileMessage({ title: msg.title || 'Message', message: msg.message || '' });
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
        const positionData = data.data || data;

        // New format: { player: "username", position: 5 }
        // Old format: just the position number
        if (typeof positionData === 'object' && positionData.player) {
            setPlayerPositions(prev => ({
                ...prev,
                [positionData.player]: positionData.position
            }));
        } else if (typeof positionData === 'number' && username) {
            // Fallback for old format
            setPlayerPositions(prev => ({
                ...prev,
                [username]: positionData
            }));
        }
    }, [username]);

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
        wsService.on('CHOICE', handleChoice);
        wsService.on('TILE_MESSAGE', handleTileMessage);
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
            wsService.off('CHOICE');
            wsService.off('TILE_MESSAGE');
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

            // Expose wsService globally for button access
            window.wsService = wsService;

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
                // Remember lobby code for display before sending join request
                setGameData(prev => ({ ...prev, lobbyCode }));
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
                    gameNotification={gameNotification}
                    playerPositions={playerPositions}
                    isHost={isHost}
                    lobbyCode={gameData.lobbyCode}
                />
            )}

            {/* Choice modal (blocking) */}
            {choicePrompt && (
                <React.Suspense fallback={null}>
                    {/* Lazy import not necessary; directly render component */}
                    {/* Importing here to avoid circular deps in some setups */}
                    {(() => {
                        const ChoiceModal = require('./components/ChoiceModal').default;
                        return (
                            <ChoiceModal
                                visible={true}
                                title={choicePrompt.title}
                                options={choicePrompt.options}
                                onSelect={(label) => {
                                    wsService.sendChoice(label);
                                    setChoicePrompt(null);
                                }}
                                onCancel={() => setChoicePrompt(null)}
                            />
                        );
                    })()}
                </React.Suspense>
            )}

            {/* Tile message (chance/community chest) */}
            {tileMessage && (
                (() => {
                    const TileMessage = require('./components/TileMessage').default;
                    return (
                        <TileMessage
                            message={tileMessage}
                            onClose={() => setTileMessage(null)}
                            autoClose={5000}
                        />
                    );
                })()
			    )
            }

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
