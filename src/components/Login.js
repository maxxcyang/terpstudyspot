import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, browserPopupRedirectResolver } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #E21833; /* UMD Red */
  color: white;
`;

const LoginForm = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  margin: 1rem 0;
  background-color: #FFD200; /* UMD Yellow */
  color: black;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background-color: #FFE44D;
  }
`;

const ErrorMessage = styled.p`
  color: #E21833;
  margin-top: 1rem;
`;

const Title = styled.h2`
  color: #E21833;
  margin-bottom: 1.5rem;
`;

const Login = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const createUserProfile = async (user) => {
    try {
      console.log('Creating user profile for:', user.uid);
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        totalStudyHours: 0,
        roomsJoined: 0,
        rank: 0,
        lastActive: new Date()
      });
      console.log('User profile created successfully');
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log('Starting Google sign in process');
      setError(''); // Clear any previous errors
      const provider = new GoogleAuthProvider();
      
      // Add additional scopes if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      // Set custom parameters
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      console.log('Attempting to sign in with popup');
      const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      console.log('Sign in successful, user:', result.user);
      
      // Check if email is from terpmail.umd.edu
      if (!result.user.email.endsWith('@terpmail.umd.edu')) {
        console.log('Invalid email domain, signing out');
        await signOut(auth);
        setError('Only @terpmail.umd.edu emails are allowed');
        return;
      }

      console.log('Creating user profile');
      await createUserProfile(result.user);
      console.log('Navigating to dashboard');
      navigate('/dashboard');
    } catch (err) {
      console.error('Sign in error details:', {
        code: err.code,
        message: err.message,
        stack: err.stack
      });
      
      if (err.code === 'auth/cancelled-popup-request' || 
          err.code === 'auth/popup-closed-by-user' ||
          err.code === 'auth/popup-blocked') {
        // User cancelled or closed the popup, no need to show error
        return;
      }
      setError(err.message);
    }
  };

  return (
    <LoginContainer>
      <LoginForm>
        <Title>TerpStudySpot</Title>
        <Button onClick={handleGoogleSignIn}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </Button>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </LoginForm>
    </LoginContainer>
  );
};

export default Login; 