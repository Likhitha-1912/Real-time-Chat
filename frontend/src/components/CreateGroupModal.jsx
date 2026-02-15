import { useState } from 'react';
import { groupApi } from '../services/api';
import { X, Check } from 'lucide-react';

export default function CreateGroupModal({ currentUser, users, onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
    setError('');
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    if (selectedUsers.length === 0) {
      setError('Please select at least one member');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const res = await groupApi.create(groupName, currentUser.id, selectedUsers);
      console.log('Group created:', res.data);
      onGroupCreated(res.data);
    } catch (err) {
      console.error('Failed to create group:', err);
      setError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <h3>Create Group Chat</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                setError('');
              }}
              placeholder="Enter group name..."
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>
              Select Members {selectedUsers.length > 0 && `(${selectedUsers.length} selected)`}
            </label>
            {users.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '12px' }}>
                No users available to add
              </p>
            ) : (
              <ul className="member-select-list">
                {users.map((user) => (
                  <li
                    key={user.id}
                    className={`member-select-item ${
                      selectedUsers.includes(user.id) ? 'selected' : ''
                    }`}
                    onClick={() => toggleUser(user.id)}
                  >
                    <div className="member-avatar">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span>{user.displayName || user.username}</span>
                    {selectedUsers.includes(user.id) && <Check size={18} />}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <div className="error-message" style={{ marginTop: '0' }}>
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedUsers.length === 0 || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
