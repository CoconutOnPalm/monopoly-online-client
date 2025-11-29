import React from 'react';
import './ChoiceModal.css';

const ChoiceModal = ({ visible, title = 'Choose an option', options = [], onSelect, onCancel }) => {
  if (!visible) return null;

  return (
    <div className="choice-modal-overlay">
      <div className="choice-modal">
        <h3 className="choice-modal-title">{title}</h3>
        <div className="choice-options">
          {options.map((opt, idx) => (
            <button
              key={idx}
              className="choice-option-btn"
              onClick={() => onSelect(opt.label)}
              title={opt.description}
            >
              <div className="choice-option-label">{opt.label}</div>
              {opt.description && <div className="choice-option-desc">{opt.description}</div>}
            </button>
          ))}
        </div>
        <div className="choice-modal-actions">
          <button className="choice-cancel-btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ChoiceModal;
