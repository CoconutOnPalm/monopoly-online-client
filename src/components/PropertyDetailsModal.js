import React from 'react';
import './PropertyDetailsModal.css';

/**
 * PropertyDetailsModal Component
 * Displays detailed information about a property and allows upgrading it
 */
const PropertyDetailsModal = ({ 
	visible, 
	property, 
	board,
	playerBalance,
	onUpgrade, 
	onClose 
}) => {
	if (!visible || !property) return null;

	// Get full tile data from board
	const tile = board.find(t => t.id === property.id);
	if (!tile) return null;

	const currentLevel = property.level || 0;
	const maxLevel = 5;
	const canUpgrade = tile.properties?.levelable && currentLevel < maxLevel;
	
	// Check if player owns monopoly (all properties of the same color)
	const propertyColor = tile.color;
	const allPropertiesOfColor = board.filter(t => 
		t.color === propertyColor && 
		t.properties?.purchasable === true
	);
	const ownedPropertiesOfColor = allPropertiesOfColor.filter(t => 
		playerBalance !== undefined && // Ensure we have player data
		board.find(bt => bt.id === t.id)
	).length;
	
	// For simplicity, we'll assume the player owns a property if it's in the modal
	// The server will validate the actual monopoly ownership
	const hasMonopoly = allPropertiesOfColor.length > 0; // Server-side validation is authoritative
	
	// Get upgrade cost from owner-costs array (index = next level)
	const upgradeCost = canUpgrade ? tile['owner-costs'][currentLevel + 1] : 0;
	const canAffordUpgrade = playerBalance >= upgradeCost;
	const isUpgradeDisabled = !canUpgrade || !canAffordUpgrade;

	/**
	 * Get level display using unicode symbols
	 * 🏠 = house (levels 1-4), 🏨 = hotel (level 5)
	 */
	const getLevelDisplay = (level) => {
		if (level === 0) return 'No buildings';
		if (level >= 1 && level <= 4) return '🏠'.repeat(level) + ` (${level} house${level > 1 ? 's' : ''})`;
		if (level === 5) return '🏨 (Hotel)';
		return '';
	};

	/**
	 * Get rent for each level
	 */
	const getRentInfo = () => {
		if (!tile['trespass-costs']) return null;
		return tile['trespass-costs'].map((rent, idx) => ({
			level: idx,
			rent: rent
		}));
	};

	const rentInfo = getRentInfo();

	return (
		<div className="property-modal-overlay" onClick={onClose}>
			<div className="property-modal" onClick={(e) => e.stopPropagation()}>
				<button className="property-modal-close" onClick={onClose}>×</button>
				
				<div className="property-modal-header">
					<h3>{tile.name}</h3>
					<div 
						className="property-modal-color-bar" 
						style={{ 
							backgroundColor: getPropertyColor(tile.color) 
						}}
					/>
				</div>

				<div className="property-modal-body">
					{/* Current Level */}
					<div className="property-info-section">
						<h4>Current Level</h4>
						<div className="property-level-display">
							{getLevelDisplay(currentLevel)}
						</div>
					</div>

					{/* Rent Information */}
					{rentInfo && (
						<div className="property-info-section">
							<h4>Rent Information</h4>
							<div className="rent-table">
								{rentInfo.map(({ level, rent }) => (
									<div 
										key={level} 
										className={`rent-row ${level === currentLevel ? 'current' : ''}`}
									>
										<span className="rent-level">
											{level === 0 && 'Base'}
											{level >= 1 && level <= 4 && `${level} 🏠`}
											{level === 5 && '🏨'}
										</span>
										<span className="rent-amount">${rent}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Upgrade Section */}
					{canUpgrade && (
						<div className="property-info-section">
							<h4>Upgrade Property</h4>
							<div className="upgrade-info">
								<p className="upgrade-monopoly-info">
									Properties in this set: <strong>{allPropertiesOfColor.map(p => p.name).join(', ')}</strong>
								</p>
								<p className="upgrade-cost">
									Cost: <strong>${upgradeCost}</strong>
								</p>
								<p className="upgrade-next-level">
									Next level: {getLevelDisplay(currentLevel + 1)}
								</p>
								{!canAffordUpgrade && (
									<p className="upgrade-warning">
										⚠️ Insufficient funds (need ${upgradeCost - playerBalance} more)
									</p>
								)}
							</div>
							<button 
								className="upgrade-btn"
								onClick={() => onUpgrade(property.id)}
								disabled={isUpgradeDisabled}
								title={!canAffordUpgrade ? 'Not enough money' : 'Upgrade property'}
							>
								⬆️ Upgrade
							</button>
						</div>
					)}

					{currentLevel === maxLevel && (
						<div className="property-info-section">
							<p className="max-level-notice">
								✅ Property is fully upgraded
							</p>
						</div>
					)}

					{!tile.properties?.levelable && (
						<div className="property-info-section">
							<p className="not-upgradeable-notice">
								ℹ️ This property cannot be upgraded
							</p>
						</div>
					)}
				</div>

				<div className="property-modal-footer">
					<button className="close-btn" onClick={onClose}>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

/**
 * Get color hex value for a tile property color
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
	return colorMap[color?.toLowerCase()] || '#999';
};

export default PropertyDetailsModal;
