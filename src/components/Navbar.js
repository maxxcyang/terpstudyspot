import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const NavContainer = styled.nav`
  background-color: ${({ theme }) => theme.colors.primary};
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const NavLink = styled.div`
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  cursor: pointer;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const LogoutButton = styled.button`
  background-color: ${({ theme }) => theme.colors.secondary};
  color: black;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;

  &:hover {
    background-color: #FFE44D;
  }
`;

const LogoutDialog = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const DialogContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const DialogButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
`;

const DialogButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
  border: none;
  
  &:first-child {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
    
    &:hover {
      background-color: ${({ theme }) => theme.colors.accent};
    }
  }
  
  &:last-child {
    background-color: #e0e0e0;
    color: black;
    
    &:hover {
      background-color: #d0d0d0;
    }
  }
`;

const Navbar = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <>
      <NavContainer>
        <Logo onClick={() => handleNavigation('/dashboard')}>TerpStudySpot</Logo>
        <NavLinks>
          <NavLink onClick={() => handleNavigation('/dashboard')}>Dashboard</NavLink>
          <NavLink onClick={() => handleNavigation('/profile')}>Profile</NavLink>
          {currentUser && (
            <LogoutButton onClick={() => setShowLogoutDialog(true)}>Logout</LogoutButton>
          )}
        </NavLinks>
      </NavContainer>

      {showLogoutDialog && (
        <LogoutDialog>
          <DialogContent>
            <h3>Are you sure you want to logout?</h3>
            <DialogButtons>
              <DialogButton onClick={handleLogout}>Yes, Logout</DialogButton>
              <DialogButton onClick={() => setShowLogoutDialog(false)}>Cancel</DialogButton>
            </DialogButtons>
          </DialogContent>
        </LogoutDialog>
      )}
    </>
  );
};

export default Navbar; 