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
    { username: 'Jyoti', password: 'jyoti123', displayName: 'Admin User', avatar: '👑', status: 'online', color: '#10b981' },
    { username: 'Raka', password: 'raka123', displayName: 'Regular User', avatar: '👤', status: 'online', color: '#3b82f6' },
    { username: 'Rahul', password: 'Rahul123', displayName: 'Demo User', avatar: '⭐', status: 'online', color: '#f59e0b' },
    { username: 'Ram', password: 'ram123', displayName: 'Guest User', avatar: '👋', status: 'offline', color: '#6b7280' },
    { username: 'Bharata', password: 'bharat123', displayName: 'Support Team', avatar: '🛠️', status: 'online', color: '#ef4444' }
  ];

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
      
      // Load all members
      const storedMembers = localStorage.getItem('chatMembers');
      if (storedMembers) {
        setMembers(JSON.parse(storedMembers));
      } else {
        setMembers(demoUsers);
        localStorage.setItem('chatMembers', JSON.stringify(demoUsers));
      }
      
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

    // Save to private chat storage
    setMessages(prev => {
      const updated = [...prev, message];
      saveChatMessages(currentUser, recipient, updated);
      return updated;
    });
    
    setNewMessage('');
  };

  const handleSelectMember = (member) => {
    setSelectedMember(member.displayName);
    
    // Load private messages between current user and selected member
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
    const user = localStorage.getItem('currentUser');
    if (loggedIn && user) {
      setIsLoggedIn(true);
      setCurrentUser(user);
      
      const storedMembers = localStorage.getItem('chatMembers');
      if (storedMembers) {
        setMembers(JSON.parse(storedMembers));
      }
      
      // Load group chat messages on login
      const groupMessages = loadChatMessages(user, 'Everyone');
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
        {/* Members Sidebar */}
        <div className="members-sidebar">
          <div className="sidebar-header">
            <h3>Contacts ({members.length})</h3>
          </div>
          <div className="members-list">
            {members.map((member) => {
              // Check if there's a private chat history
              const hasChat = localStorage.getItem(getChatKey(currentUser, member.displayName));
              const isOnline = member.status === 'online';
              
              return (
                <div
                  key={member.username}
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

        {/* Chat Area */}
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
