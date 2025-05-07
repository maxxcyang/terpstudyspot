import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const ProfileContainer = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const ProfileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const UserInfo = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const UserName = styled.h3`
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const UserEmail = styled.p`
  color: #666;
`;

const BackButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.accent};
  }
`;

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <ProfileContainer>
      <ProfileHeader>
        <h2>Your Profile</h2>
        <BackButton onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </BackButton>
      </ProfileHeader>

      <UserInfo>
        <UserName>{currentUser.displayName || currentUser.email.split('@')[0]}</UserName>
        <UserEmail>{currentUser.email}</UserEmail>
      </UserInfo>
    </ProfileContainer>
  );
};

export default Profile; 