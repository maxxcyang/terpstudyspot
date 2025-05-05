import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize auth with local persistence
    const initializeAuthState = async () => {
      try {
        // Set persistence to LOCAL before any other auth operations
        await setPersistence(auth, browserLocalPersistence);
        
        // Set up auth state listener
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setCurrentUser(user);
          setLoading(false);
        }, (error) => {
          // Only set error if it's not a popup-closed error
          if (error.code !== 'auth/popup-closed-by-user') {
            console.error('Auth state change error:', error);
            setError(error.message);
          }
          setLoading(false);
        });

        // Cleanup subscription on unmount
        return unsubscribe;
      } catch (error) {
        console.error('Error initializing auth:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    initializeAuthState();
  }, []);

  const value = {
    currentUser,
    loading,
    error
  };

  // Don't render anything while loading
  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#E21833',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'white', fontSize: '24px' }}>Loading...</div>
      </div>
    );
  }

  // Don't render anything if there's an error
  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#E21833',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        Error: {error}
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 