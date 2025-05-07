import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

const LoginContainer = styled.div`
  display: flex; 
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #E21833;
`;

const LoginCard = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1.5rem;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 2rem;
`;

const GoogleButton = styled.button`
  background-color: white;
  color: #757575;
  border: 1px solid #ddd;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  img {
    width: 24px;
    height: 24px;
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #ffebee;
  border-radius: 4px;
  width: 100%;
`;

const Login = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser, setError: setAuthError } = useAuth();

  useEffect(() => {
    if (currentUser) {
      console.log('User is logged in, navigating to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const resetState = () => {
    setError('');
    setAuthError(null);
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log('Starting Google sign in process');
      resetState();
      setIsLoading(true);
      
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      console.log('Provider configured:', provider);
      console.log('Attempting to sign in with popup...');
      
      // Add a timeout to detect if popup is blocked
      const popupPromise = signInWithPopup(auth, provider);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Popup timeout - might be blocked')), 5000);
      });

      const result = await Promise.race([popupPromise, timeoutPromise]);
      console.log('Sign in successful, user:', result.user);
      
      if (!result.user.email.endsWith('@terpmail.umd.edu')) {
        console.log('Invalid email domain, signing out');
        await signOut(auth);
        setError('Only @terpmail.umd.edu emails are allowed');
        return;
      }

      console.log('Navigating to dashboard');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Error during sign in:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error object:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        resetState();
      } else if (error.code === 'auth/popup-blocked') {
        setError('Pop-up was blocked. Please allow pop-ups for this site.');
      } else if (error.message.includes('Popup timeout')) {
        setError('Authentication popup was blocked. Please allow pop-ups for this site.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
      if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Title>Welcome to TerpStudySpot</Title>
        <Subtitle>
          Sign in with your @terpmail.umd.edu account to join study rooms
        </Subtitle>
        <GoogleButton onClick={handleGoogleSignIn} disabled={isLoading}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </GoogleButton>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </LoginCard>
    </LoginContainer>
  );
};

export default Login; 