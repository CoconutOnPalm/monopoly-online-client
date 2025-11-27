import React, { useState } from 'react';
import config from '../config';
import './LoginScreen.css';

/**
 * LoginScreen Component
 * Handles username and lobby code input for joining a game
 */
const LoginScreen = ({ onJoin }) => {
	const [username, setUsername] = useState('');
	const [lobbyCode, setLobbyCode] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState({});

	// Listen for reset loading event
	React.useEffect(() => {
		const handleReset = () => setIsLoading(false);
		window.addEventListener('resetLoginLoading', handleReset);
		return () => window.removeEventListener('resetLoginLoading', handleReset);
	}, []);	/**
	 * Validate username input
	 * @param {string} value - Username value
	 * @returns {string|null} - Error message or null
	 */
	const validateUsername = (value) => {
		if (!value.trim()) {
			return 'Username is required';
		}
		if (value.length < 2) {
			return 'Username must be at least 2 characters';
		}
		if (value.length > 20) {
			return 'Username must not exceed 20 characters';
		}
		return null;
	};

	/**
	 * Validate lobby code input
	 * @param {string} value - Lobby code value
	 * @returns {string|null} - Error message or null
	 */
	const validateLobbyCode = (value) => {
		if (!value.trim()) {
			return 'Lobby code is required';
		}
		if (value.length !== config.game.lobbyCodeLength) {
			return `Lobby code must be ${config.game.lobbyCodeLength} characters`;
		}
		if (!/^[A-Za-z0-9]+$/.test(value)) {
			return 'Lobby code must contain only letters and numbers';
		}
		return null;
	};

	/**
	 * Handle username input change
	 */
	const handleUsernameChange = (e) => {
		const value = e.target.value;
		setUsername(value);

		// Clear error on change
		if (errors.username) {
			setErrors(prev => ({ ...prev, username: null }));
		}
	};

	/**
	 * Handle lobby code input change
	 * Convert to uppercase and limit to 6 characters
	 */
	const handleLobbyCodeChange = (e) => {
		const value = e.target.value.toUpperCase().slice(0, config.game.lobbyCodeLength);
		setLobbyCode(value);

		// Clear error on change
		if (errors.lobbyCode) {
			setErrors(prev => ({ ...prev, lobbyCode: null }));
		}
	};

	/**
	 * Handle form submission
	 */
	const handleSubmit = (e) => {
		e.preventDefault();

		// Validate inputs
		const usernameError = validateUsername(username);
		const lobbyCodeError = validateLobbyCode(lobbyCode);

		if (usernameError || lobbyCodeError) {
			setErrors({
				username: usernameError,
				lobbyCode: lobbyCodeError
			});
			return;
		}

		// Clear errors and set loading state
		setErrors({});
		setIsLoading(true);

		// Call parent handler
		onJoin(username.trim(), lobbyCode.trim());
	};

	/**
	 * Handle create lobby button click
	 */
	const handleCreateLobby = () => {
		// Validate username only
		const usernameError = validateUsername(username);

		if (usernameError) {
			setErrors({
				username: usernameError
			});
			return;
		}

		// Clear errors and set loading state
		setErrors({});
		setIsLoading(true);

		// Call parent handler with empty lobby code to signal creation
		onJoin(username.trim(), '');
	};

	return (
		<div className="login-screen">
			<div className="login-container">
				<div className="login-header">
					<h1>Monopoly Online</h1>
					<p className="subtitle">Join a game to start playing</p>
				</div>

				<form onSubmit={handleSubmit} className="login-form">
					<div className="form-group">
						<label htmlFor="username">Username</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={handleUsernameChange}
							placeholder="Enter your username"
							disabled={isLoading}
							className={errors.username ? 'error' : ''}
							autoComplete="off"
							autoFocus
						/>
						{errors.username && (
							<span className="error-message">{errors.username}</span>
						)}
					</div>

					<div className="form-group">
						<label htmlFor="lobbyCode">Lobby Code</label>
						<input
							id="lobbyCode"
							type="text"
							value={lobbyCode}
							onChange={handleLobbyCodeChange}
							placeholder="Enter 6-digit code"
							disabled={isLoading}
							className={errors.lobbyCode ? 'error' : ''}
							autoComplete="off"
							maxLength={config.game.lobbyCodeLength}
						/>
						{errors.lobbyCode && (
							<span className="error-message">{errors.lobbyCode}</span>
						)}
					</div>

					<button
						type="submit"
						className="join-button"
						disabled={isLoading}
					>
						{isLoading ? 'Joining...' : 'Join Game'}
					</button>
				</form>

				<div className="divider">
					<span>or</span>
				</div>

				<button
					type="button"
					className="create-button"
					onClick={handleCreateLobby}
					disabled={isLoading}
				>
					{isLoading ? 'Creating...' : 'Create New Lobby'}
				</button>

				<div className="login-footer">
					<p className="help-text">
						Create a lobby to host a game or join an existing one with a code.
					</p>
				</div>
			</div>
		</div>
	);
};

export default LoginScreen;
