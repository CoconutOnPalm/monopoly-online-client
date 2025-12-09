import React from 'react';
import './GameBoard.css';


function arrayToRGB(arr) {
    // console.log("arrayToRGB func:")
    // console.log(arr, " length=", arr.length)
    // if (arr.length != 3)
    //     return "(0, 0, 0)"

    // console.log(`rgb=rgb(${arr[0]}, ${arr[1]}, ${arr[2]})`);
    // return `(${arr[0]}, ${arr[1]}, ${arr[2]})`

    arr = toString(arr)
    arr.replace("[", "(")
    arr.replace("]", ")")
    console.log(arr)
    return arr
}


/**
 * GameBoard Component
 * Displays the Monopoly game board in a square layout
 */
const GameBoard = ({ board, players, pawns, currentTurn, playerData, balanceNotification, gameNotification, playerPositions, isHost, lobbyCode, onPropertyClick }) => {
	if (!board || board.length === 0) {
		return (
			<div className="game-board-container">
				<div className="loading">Loading game board...</div>
			</div>
		);
	}

	/**
	 * Get pawn color RGB string for a player
	 */
	const getPawnColor = (pawnName) => {
		let color =  pawnName ? pawns.filter(pawn => { return pawn.name === pawnName })[0].rgb : '#999';
        console.log("[DEBUG]: ", color)
        return "rgb" + color
	};

	/**
	 * Get players at a specific tile position
	 */
	const getPlayersAtPosition = (tileId) => {
		if (!playerPositions || !players) return [];
		return players.filter(player => playerPositions[player.username] === tileId);
	};

	/**
	 * Get level display for property using unicode symbols
	 * 🏠 = house, 🏨 = hotel
	 */
	const getLevelDisplay = (level) => {
		if (level === 0) return '';
		if (level >= 1 && level <= 4) return '🏠'.repeat(level);
		if (level === 5) return '🏨';
		return '';
	};

	/**
	 * Get color hex value for a tile property color
	 * Maps monopoly color names to actual colors
	 */
	const getPropertyColor = (color) => {
		const colorMap = {
			'brown': '#8B4513',
			'cyan': '#87CEEB',
			'magenta': '#FF00FF',
			'orange': '#FFA500',
			'red': '#FF0000',
			'yellow': '#FFFF00',
			'green': '#00FF00',
			'blue': '#0000FF',
			'purple': '#800080'
		};
		return colorMap[color.toLowerCase()] || 'transparent';
	};

	/**
	 * Render a single tile on the board
	 */
	const renderTile = (tile, position) => {
		const isProperty = tile.type === 'property';
		const propertyColor = isProperty ? getPropertyColor(tile.color) : null;
		const playersOnTile = getPlayersAtPosition(tile.id);

		return (
			<div key={tile.id} className={`tile tile-${position}`} data-tile-id={tile.id}>
				{propertyColor && (
					<div
						className="property-color-bar"
						style={{ backgroundColor: propertyColor }}
					/>
				)}
				<div className="tile-content">
					<span className="tile-name">{tile.name}</span>
					{tile.type !== 'property' && tile.type !== 'transport' && tile.type !== 'utility' && (
						<span className="tile-type">{tile.type}</span>
					)}
					{isProperty && tile['owner-costs'] && tile['owner-costs'][0] > 0 && (
						<span className="tile-price">${tile['owner-costs'][0]}</span>
					)}
				</div>
				
				{/* Render pawns on this tile */}
				{playersOnTile.length > 0 && (
					<div className="tile-pawns">
						{playersOnTile.map((player, idx) => (
							<div
								key={player.username}
								className="tile-pawn"
								style={{
									backgroundColor: getPawnColor(player.pawn),
									zIndex: idx + 1
								}}
								title={player.username}
							/>
						))}
					</div>
				)}
			</div>
		);
	};

	/**
	 * Sort tiles by ID and distribute clockwise starting from bottom-right corner
	 * Clockwise path: bottom-right → bottom-left → top-left → top-right → bottom-right
	 * Total 40 tiles arranged as:
	 * - Bottom row: 11 tiles (0-10) going right to left
	 * - Left column: 9 tiles (11-19) going bottom to top
	 * - Top row: 11 tiles (20-30) going left to right
	 * - Right column: 9 tiles (31-39) going top to bottom
	 */
	const sortedBoard = [...board].sort((a, b) => a.id - b.id);
	
	const bottomTiles = sortedBoard.slice(0, 11);    // 0-10
	const leftTiles = sortedBoard.slice(11, 20);     // 11-19
	const topTiles = sortedBoard.slice(20, 31);      // 20-30
	const rightTiles = sortedBoard.slice(31, 40);    // 31-39

		return (
		<div className="game-board-container">
			{/* Balance notification */}
			{balanceNotification !== null && (
				<div className={`balance-notification ${balanceNotification > 0 ? 'positive' : 'negative'}`}>
					{balanceNotification > 0 ? '+' : ''}{balanceNotification}$
				</div>
			)}
			
			{/* Game notification */}
			{gameNotification && (
				<div className={`game-notification ${gameNotification.type}`}>
					{gameNotification.message}
				</div>
			)}

			<div className="game-info">
				<h2>Monopoly Online</h2>
				{currentTurn && (
					<p className="current-turn">Current Turn: <strong>{currentTurn}</strong></p>
				)}
			</div>

			<div className="game-layout">
				{/* Left Panel - Player Info */}
				<div className="side-panel left-panel">
					<h3>Your Stats</h3>
					
					{/* Action Buttons */}
					<div className="action-buttons">
						<button className="action-btn roll-btn" onClick={() => window.wsService?.requestRoll()}>
							🎲 Roll Dice
						</button>
						<button className="action-btn finish-btn" onClick={() => window.wsService?.finishTurn(window.currentUsername)}>
							✓ End Turn
						</button>
					</div>

					{/* Player balance and properties */}
					{playerData && (
						<div className="player-info-panel">
							<div className="balance-display">
								<span className="balance-label">Balance:</span>
								<span className="balance-amount">${playerData.balance}</span>
							</div>
							
							{playerData.ownedProperties && playerData.ownedProperties.length > 0 && (
								<div className="owned-properties">
									<h4>Your Properties</h4>
									<div className="properties-list">
										{playerData.ownedProperties.map((property, idx) => (
											<div 
												key={idx} 
												className="property-card clickable"
												onClick={() => onPropertyClick && onPropertyClick(property)}
												title="Click to view details and upgrade"
											>
												<div 
													className="property-card-color" 
													style={{ backgroundColor: getPropertyColor(property.color) }}
												/>
												<div className="property-card-info">
													<div className="property-card-name">{property.name}</div>
													{property.level !== undefined && (
														<div className="property-card-level">
															{getLevelDisplay(property.level)}
														</div>
													)}
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Center - Game Board */}
				<div className="game-board">
				{/* Top row: tiles 20-30 (left to right) */}
				<div className="board-row board-top">
					{topTiles.map(tile => renderTile(tile, 'top'))}
				</div>

				{/* Middle section with left and right columns */}
				<div className="board-middle">
					{/* Left column: tiles 11-19 (bottom to top, reversed) */}
					<div className="board-column board-left">
						{[...leftTiles].reverse().map(tile => renderTile(tile, 'left'))}
					</div>

					{/* Center area - board title */}
					<div className="board-center">
						<div className="center-content">
							<h3>Monopoly</h3>
						</div>
					</div>

					{/* Right column: tiles 31-39 (top to bottom) */}
					<div className="board-column board-right">
						{rightTiles.map(tile => renderTile(tile, 'right'))}
					</div>
				</div>

			{/* Bottom row: tiles 0-10 (right to left, reversed) */}
			<div className="board-row board-bottom">
				{[...bottomTiles].reverse().map(tile => renderTile(tile, 'bottom'))}
			</div>
		</div>

		{/* Right Panel - Players List */}
		<div className="side-panel right-panel">
			<h3>Players</h3>
			
			{/* Start Game / End Game button for host */}
			{isHost && !currentTurn && (
				<button 
					className="start-game-btn"
					onClick={() => window.wsService?.startGame()}
				>
					🎮 Start Game
				</button>
			)}
			{isHost && currentTurn && (
				<button 
					className="end-game-btn"
					onClick={() => {
						if (window.confirm('Are you sure you want to end the game?')) {
							window.wsService?.endGame();
						}
					}}
				>
					🛑 End Game
				</button>
			)}

			{/* Lobby code label for host (below Start button) */}
			{isHost && lobbyCode && (
				<div className="lobby-code-label">Lobby Code: <strong>{lobbyCode}</strong></div>
			)}
			
			<div className="players-list">
				{/* For non-hosts, show lobby code above players list */}
				{!isHost && lobbyCode && (
					<div className="lobby-code-label">Lobby Code: <strong>{lobbyCode}</strong></div>
				)}
				{players && players.length > 0 ? (
					players.map((player, idx) => (
						<div key={idx} className="player-item">
							<span
								className="player-pawn"
								style={{
									backgroundColor: player.pawn ? getPawnColor(player.pawn) : '#999'
								}}
							/>
							<span className="player-name">{player.username}</span>
						</div>
					))
				) : (
					<p className="no-players">No players yet</p>
				)}
			</div>
		</div>
	</div>
	</div>
	);
};export default GameBoard;
