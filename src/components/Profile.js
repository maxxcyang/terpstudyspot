import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../firebase';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, setDoc } from 'firebase/firestore';
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

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #666;
`;

const LeaderboardContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const LeaderboardTitle = styled.h3`
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1rem;
`;

const LeaderboardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const LeaderboardItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: ${({ $isCurrentUser }) => ($isCurrentUser ? '#FFF5E6' : 'transparent')};
  border-radius: 4px;
`;

const Rank = styled.span`
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
`;

const Name = styled.span`
  font-weight: bold;
`;

const Hours = styled.span`
  color: #666;
`;

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          // Create user profile if it doesn't exist
          await setDoc(userRef, {
            name: currentUser.displayName || currentUser.email.split('@')[0],
            email: currentUser.email,
            totalStudyHours: 0,
            roomsJoined: 0,
            rank: 0,
            createdAt: new Date().toISOString()
          });
          setUserData({
            name: currentUser.displayName || currentUser.email.split('@')[0],
            email: currentUser.email,
            totalStudyHours: 0,
            roomsJoined: 0,
            rank: 0
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load profile data');
      }
    };

    const fetchLeaderboard = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('totalStudyHours', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        const leaderboardData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLeaderboard(leaderboardData);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError('Failed to load leaderboard');
      }
    };

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchUserData(), fetchLeaderboard()]);
      setLoading(false);
    };

    fetchData();
  }, [currentUser, navigate]);

  if (loading) {
    return <ProfileContainer>Loading...</ProfileContainer>;
  }

  if (error) {
    return (
      <ProfileContainer>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </ProfileContainer>
    );
  }

  const formatHours = (hours) => {
    return Math.round(hours * 10) / 10;
  };

  return (
    <ProfileContainer>
      <ProfileHeader>
        <h2>Your Profile</h2>
      </ProfileHeader>

      <UserInfo>
        <h3>{userData?.name}</h3>
        <p>{userData?.email}</p>
      </UserInfo>

      <StatsContainer>
        <StatCard>
          <StatValue>{formatHours(userData?.totalStudyHours || 0)}</StatValue>
          <StatLabel>Total Study Hours</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{userData?.roomsJoined || 0}</StatValue>
          <StatLabel>Rooms Joined</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{userData?.rank || 'N/A'}</StatValue>
          <StatLabel>Current Rank</StatLabel>
        </StatCard>
      </StatsContainer>

      <LeaderboardContainer>
        <LeaderboardTitle>Top 10 Students</LeaderboardTitle>
        <LeaderboardList>
          {leaderboard.map((user, index) => (
            <LeaderboardItem key={user.id} $isCurrentUser={user.id === currentUser.uid}>
              <Rank>#{index + 1}</Rank>
              <Name>{user.name}</Name>
              <Hours>{formatHours(user.totalStudyHours || 0)} hours</Hours>
            </LeaderboardItem>
          ))}
        </LeaderboardList>
      </LeaderboardContainer>
    </ProfileContainer>
  );
};

export default Profile; 