import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ChatLayout from './components/ChatLayout';
import Login from './components/Login';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('chatUser');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('chatUser');
      }
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('chatUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('chatUser');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            currentUser ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/*"
          element={
            currentUser ? (
              <ChatLayout currentUser={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
