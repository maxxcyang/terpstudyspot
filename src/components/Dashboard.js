import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../firebase';
import { collection, query, getDocs, doc, setDoc, getDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import courseData from '../data/course_and_instructors.json';
import DailyIframe from '@daily-co/daily-js';

const DashboardContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.secondary};
  }
`;

const SearchButton = styled.button`
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

const RoomGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const RoomCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const RoomTitle = styled.h3`
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const RoomInfo = styled.p`
  color: #666;
  margin-bottom: 1rem;
`;

const JoinButton = styled.button`
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

const WelcomeMessage = styled.div`
  text-align: center;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 2rem 0;
`;

const WelcomeTitle = styled.h2`
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1rem;
`;

const WelcomeText = styled.p`
  color: #666;
  margin-bottom: 1rem;
`;

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedRooms, setDisplayedRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ roomsCreated: 0, roomsReused: 0 });
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const createDailyRoom = useCallback(async (roomName) => {
    try {
      console.log('Creating Daily.co room:', roomName);
      
      // First check if the room exists
      const checkResponse = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_DAILY_CO_API}`
        }
      });

      if (checkResponse.ok) {
        // Room exists, return its URL
        const roomData = await checkResponse.json();
        return roomData.url;
      }

      // Room doesn't exist, create it
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_DAILY_CO_API}`
        },
        body: JSON.stringify({
          name: roomName,
          privacy: 'public',
          properties: {
            enable_chat: true,
            enable_knocking: true,
            enable_screenshare: true,
            start_video_off: true,
            start_audio_off: true,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours from now
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Daily.co API error:', errorData);
        throw new Error(`Failed to create Daily.co room: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Daily.co room created:', data);
      return data.url;
    } catch (error) {
      console.error('Error creating Daily.co room:', error);
      throw error;
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Process course data to create room entries in Firestore
      const allRooms = [];
      let roomsCreated = 0;
      let roomsReused = 0;

      for (const [courseCode, instructors] of Object.entries(courseData)) {
        if (!instructors || instructors.length === 0) continue;

        for (const instructor of instructors) {
          if (!instructor || instructor.trim() === '') continue;

          const roomKey = `${courseCode}-${instructor}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
          
          const newRoom = {
            id: roomKey,
            course: courseCode,
            professor: instructor,
            onlineCount: 0,
            createdAt: new Date().toISOString()
          };
          
          allRooms.push(newRoom);
          roomsCreated++;
        }
      }
      
      setAllRooms(allRooms);
      setStats({ roomsCreated, roomsReused });
      setDisplayedRooms([]); // Start with no rooms displayed
    } catch (error) {
      console.error('Error in fetchRooms:', error);
      setError('Failed to load rooms. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Use useMemo to cache the rooms data
  const cachedRooms = useMemo(() => allRooms, [allRooms]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Only fetch rooms if we don't have them cached
    if (cachedRooms.length === 0) {
      fetchRooms();
    }
  }, [currentUser, navigate, fetchRooms, cachedRooms]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setDisplayedRooms([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Use a small delay to ensure loading state is visible
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const searchTermLower = searchTerm.toLowerCase();
      const filteredRooms = cachedRooms.filter(room => 
        room.course.toLowerCase().includes(searchTermLower) ||
        room.professor.toLowerCase().includes(searchTermLower)
      );
      setDisplayedRooms(filteredRooms);
    } catch (error) {
      console.error('Error in search:', error);
      setError('Failed to search rooms. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleJoinRoom = async (roomId, meetLink) => {
    try {
      // If meetLink doesn't exist, create the Daily.co room
      if (!meetLink) {
        const dailyRoomUrl = await createDailyRoom(roomId);
        
        // Update the room in Firestore with the meetLink
        const roomRef = doc(db, 'rooms', roomId);
        await setDoc(roomRef, {
          meetLink: dailyRoomUrl,
          onlineCount: 0
        }, { merge: true });
        
        meetLink = dailyRoomUrl;
      }

      // Open the room in a new tab
      window.open(meetLink, '_blank');
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Failed to join the room. Please try again.');
    }
  };

  // Set up real-time listener for room updates
  useEffect(() => {
    const unsubscribes = [];
    
    allRooms.forEach(room => {
      if (room.id) {
        const roomRef = doc(db, 'rooms', room.id);
        const unsubscribe = onSnapshot(roomRef, (doc) => {
          if (doc.exists()) {
            const roomData = doc.data();
            setAllRooms(prevRooms => 
              prevRooms.map(r => 
                r.id === room.id ? { ...r, onlineCount: roomData.onlineCount || 0 } : r
              )
            );
          }
        });
        unsubscribes.push(unsubscribe);
      }
    });

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [allRooms]);

  if (loading && cachedRooms.length === 0) {
    return (
      <DashboardContainer>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Loading rooms...
        </div>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={fetchRooms}>Retry</button>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="Search for courses or professors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <SearchButton onClick={handleSearch}>Search</SearchButton>
      </SearchContainer>

      {searchLoading ? (
        <WelcomeMessage>
          <WelcomeTitle>Searching...</WelcomeTitle>
          <WelcomeText>Please wait while we find your study rooms.</WelcomeText>
        </WelcomeMessage>
      ) : displayedRooms.length === 0 ? (
        <WelcomeMessage>
          <WelcomeTitle>Welcome to TerpStudySpot!</WelcomeTitle>
          <WelcomeText>
            Search for a course or professor to find study rooms.
            <br />
            Example: "CMSC131" or "Smith"
          </WelcomeText>
          <WelcomeText>
            Stats: {stats.roomsCreated} rooms created, {stats.roomsReused} rooms reused
          </WelcomeText>
        </WelcomeMessage>
      ) : (
        <RoomGrid>
          {displayedRooms.map((room) => (
            <RoomCard key={room.id}>
              <RoomTitle>{room.course}</RoomTitle>
              <RoomInfo>Professor: {room.professor}</RoomInfo>
              <RoomInfo>Students Online: {room.onlineCount || 0}</RoomInfo>
              <JoinButton onClick={() => handleJoinRoom(room.id, room.meetLink)}>
                Join Room
              </JoinButton>
            </RoomCard>
          ))}
        </RoomGrid>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;