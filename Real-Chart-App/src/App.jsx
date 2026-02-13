import { useState, useEffect, useRef } from 'react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Chat states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [members, setMembers] = useState([]);

  const messagesEndRef = useRef(null);

  const demoUsers = [
    { username: 'ram', password: 'ram123', displayName: 'RAM', avatar: '👑', status: 'online', color: '#10b981' },
    { username: 'jyoti', password: 'jyoti123', displayName: 'JYOTI', avatar: '👤', status: 'online', color: '#3b82f6' },
    { username: 'sarat', password: 'sarat123', displayName: 'SARAT', avatar: '⭐', status: 'online', color: '#f59e0b' },
    { username: 'abhijeet', password: 'abhijeet123', displayName: 'ABHIJEET', avatar: '👋', status: 'offline', color: '#6b7280' },
    { username: 'bharat', password: 'bharat123', displayName: 'BHARAT', avatar: '🛠️', status: 'online', color: '#ef4444' }
  ];

  // FIXED: Filter out current user from members list and ensure proper data structure
  const getFilteredMembers = (currentUserDisplayName) => {
    return demoUsers.filter(user => user.displayName !== currentUserDisplayName);
  };

  // Get private chat key between two users
  const getChatKey = (user1, user2) => {
    const sorted = [user1, user2].sort();
    return `chat_${sorted[0]}_${sorted[1]}`;
  };

  // Load messages for specific chat
  const loadChatMessages = (user1, user2) => {
    const chatKey = getChatKey(user1, user2);
    const stored = localStorage.getItem(chatKey);
    return stored ? JSON.parse(stored) : [];
  };

  // Save messages for specific chat
  const saveChatMessages = (user1, user2, messages) => {
    const chatKey = getChatKey(user1, user2);
    localStorage.setItem(chatKey, JSON.stringify(messages));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const user = demoUsers.find(
      u => u.username === username && u.password === password
    );

    if (user) {
      setIsLoggedIn(true);
      setCurrentUser(user.displayName);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', user.displayName);
      
      // FIXED: Always use fresh demoUsers and filter out current user
      const filteredMembers = getFilteredMembers(user.displayName);
      setMembers(filteredMembers);
      localStorage.setItem('chatMembers', JSON.stringify(filteredMembers));
      
      // Load user's own group messages
      const groupKey = getChatKey(user.displayName, 'Everyone');
      const groupMessages = loadChatMessages(user.displayName, 'Everyone');
      setMessages(groupMessages);
      
      // Add welcome message to group chat
      const welcomeMsg = {
        id: Date.now(),
        text: `Welcome to the chat, ${user.displayName}!`,
        sender: 'system',
        time: new Date().toLocaleTimeString()
      };
      setMessages(prev => {
        const updated = [...prev, welcomeMsg];
        saveChatMessages(user.displayName, 'Everyone', updated);
        return updated;
      });
    } else {
      setError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser('');
    setMessages([]);
    setSelectedMember(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('chatMembers'); // Clear corrupted members data
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const recipient = selectedMember || 'Everyone';
    const message = {
      id: Date.now(),
      text: newMessage,
      sender: currentUser,
      time: new Date().toLocaleTimeString()
    };

    setMessages(prev => {
      const updated = [...prev, message];
      saveChatMessages(currentUser, recipient, updated);
      return updated;
    });
    
    setNewMessage('');
  };

  const handleSelectMember = (member) => {
    setSelectedMember(member.displayName);
    const privateMessages = loadChatMessages(currentUser, member.displayName);
    setMessages(privateMessages);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    const userDisplayName = localStorage.getItem('currentUser');
    if (loggedIn && userDisplayName) {
      setIsLoggedIn(true);
      setCurrentUser(userDisplayName);
      
      // FIXED: Always regenerate proper members list
      const filteredMembers = getFilteredMembers(userDisplayName);
      setMembers(filteredMembers);
      
      const groupMessages = loadChatMessages(userDisplayName, 'Everyone');
      setMessages(groupMessages);
    }
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Private Chat</h1>
            <p className="login-subtitle">User-specific message storage</p>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label className="input-label">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Enter username"
                required
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter password"
                required
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" className="login-button">Join Chat</button>
          </form>
          
          <div className="demo-info">
            Demo: bharat/bharat123 | abhijeet/abhijeet123 | sarat/sarat123 | jyoti/jyoti123 | ram/ram123
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="header-content">
          <div>
            <h1 className="chat-title">Private Messages</h1>
            <p className="user-status">
              Online as: <strong>{currentUser}</strong> 
              {selectedMember && ` | Private: ${selectedMember}`}
            </p>
          </div>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </header>

      <div className="chat-content">
        <div className="members-sidebar">
          <div className="sidebar-header">
            <h3>Contacts ({members.length})</h3>
          </div>
          <div className="members-list">
            {members.map((member) => {
              // FIXED: Now works correctly with proper member objects
              const hasChat = localStorage.getItem(getChatKey(currentUser, member.displayName));
              
              return (
                <div
                  key={member.username} // Use username as key (unique)
                  className={`member-item 
                    ${selectedMember === member.displayName ? 'member-selected' : ''} 
                    ${hasChat ? 'has-chat' : ''}`}
                  onClick={() => handleSelectMember(member)}
                  style={{ '--member-color': member.color }}
                >
                  <div className="member-avatar">{member.avatar}</div>
                  <div className="member-info">
                    <div className="member-name">{member.displayName}</div>
                    <div className={`member-status ${member.status}`}>
                      {member.status} {hasChat && <span className="chat-badge">●</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rest of JSX remains same */}
        <div className="chat-area">
          <div className="chat-header-info">
            {selectedMember ? (
              <span>Private chat with <strong>{selectedMember}</strong></span>
            ) : (
              <span>Group Chat - Click contacts for private messages</span>
            )}
          </div>
          
          <div className="messages-container">
            <div className="messages-wrapper">
              {messages.length === 0 ? (
                <div className="no-messages">
                  {selectedMember 
                    ? `Start conversation with ${selectedMember}...` 
                    : 'Group chat messages appear here'
                  }
                </div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`message ${message.sender === currentUser ? 'message-sent' : 'message-received'}`}
                  >
                    <div className="message-content">
                      <div className="message-sender">{message.sender}</div>
                      <div className="message-text">{message.text}</div>
                      <div className="message-time">{message.time}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="message-form">
            <div className="message-input-group">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="message-input"
                placeholder={selectedMember ? `Message ${selectedMember}...` : "Group message..."}
                autoFocus
              />
              <button type="submit" className="send-button">Send</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
