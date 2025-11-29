import React, { useEffect } from 'react';
import './TileMessage.css';

const TileMessage = ({ message, onClose, autoClose = 5000 }) => {
  useEffect(() => {
    if (!message) return;
    if (autoClose) {
      const t = setTimeout(() => onClose && onClose(), autoClose);
      return () => clearTimeout(t);
    }
  }, [message, autoClose, onClose]);

  if (!message) return null;

  return (
    <div className="tile-message-overlay">
      <div className="tile-message">
        <div className="tile-message-header">
          <h4 className="tile-message-title">{message.title}</h4>
          <button className="tile-message-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="tile-message-body">{message.message}</div>
      </div>
    </div>
  );
};

export default TileMessage;
