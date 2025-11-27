import React, { useEffect } from 'react';
import './ErrorPopup.css';

/**
 * ErrorPopup Component
 * Non-blocking popup for displaying error messages
 */
const ErrorPopup = ({ error, onClose, autoCloseDelay = 5000 }) => {
	useEffect(() => {
		if (!error || !autoCloseDelay) return;

		// Auto-close after delay
		const timer = setTimeout(() => {
			onClose();
		}, autoCloseDelay);

		return () => clearTimeout(timer);
	}, [error, onClose, autoCloseDelay]);

	if (!error) return null;

	return (
		<div className="error-popup-overlay">
			<div className="error-popup">
				<div className="error-popup-header">
					<h3>Error</h3>
					<button
						className="close-button"
						onClick={onClose}
						aria-label="Close error"
					>
						×
					</button>
				</div>
				<div className="error-popup-body">
					{error.code && (
						<div className="error-code">Error Code: {error.code}</div>
					)}
					<p className="error-message">{error.message || 'An unknown error occurred'}</p>
				</div>
				<div className="error-popup-footer">
					<button className="dismiss-button" onClick={onClose}>
						Dismiss
					</button>
				</div>
			</div>
		</div>
	);
};

export default ErrorPopup;
