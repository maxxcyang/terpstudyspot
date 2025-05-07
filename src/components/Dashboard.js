import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import courseData from '../data/course_and_instructors.json';
import config from '../config';

const DashboardContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const ContentContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  flex: 1;
`;

const Footer = styled.footer`
  background-color: #FFE44D;
  padding: 1.5rem;
  width: 100%;
  text-align: center;
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1rem;
`;

const FooterLink = styled.a`
  color: #000;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const DeveloperCredit = styled.p`
  color: #000;
  margin: 0;
  font-size: 0.9rem;
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

const RoomCardWrapper = styled.div`
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

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  background-color: #ffebee;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  padding: 0 1rem;
`;

const PageButton = styled.button`
  background-color: ${({ active }) => active ? '#E21833' : 'white'};
  color: ${({ active }) => active ? 'white' : '#E21833'};
  border: 1px solid #E21833;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
  min-width: 40px;

  &:hover {
    background-color: ${({ active }) => active ? '#E21833' : '#FFE44D'};
    color: ${({ active }) => active ? 'white' : 'black'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Ellipsis = styled.span`
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
  color: #666;
`;

const RoomCard = React.memo(({ room, onJoinRoom }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleJoinClick = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onJoinRoom(room.id, room.course, room.professor);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoomCardWrapper>
      <RoomTitle>{room.course}</RoomTitle>
      <RoomInfo>Professor: {room.professor}</RoomInfo>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <JoinButton onClick={handleJoinClick} disabled={isLoading}>
        {isLoading ? 'Joining...' : 'Join Room'}
      </JoinButton>
    </RoomCardWrapper>
  );
});

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedRooms, setDisplayedRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 6;

  const sanitizeRoomName = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const createDailyRoom = useCallback(async (roomName) => {
    try {
      console.log('Creating Daily.co room:', roomName);
      
      const sanitizedName = sanitizeRoomName(roomName);
      
      // First check if the room exists
      const checkResponse = await fetch(`https://api.daily.co/v1/rooms/${sanitizedName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.dailyCoApiKey}`
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
          'Authorization': `Bearer ${config.dailyCoApiKey}`
        },
        body: JSON.stringify({
          name: sanitizedName,
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

  // Initialize rooms list without creating Daily.co rooms
  React.useEffect(() => {
    const rooms = [];
    for (const [courseCode, instructors] of Object.entries(courseData)) {
      for (const instructor of instructors) {
        rooms.push({
          id: sanitizeRoomName(`${courseCode}-${instructor}`),
          course: courseCode,
          professor: instructor,
          meetLink: null
        });
      }
    }
    setAllRooms(rooms);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setDisplayedRooms([]);
      setHasSearched(false);
      setCurrentPage(1);
      return;
    }

    setSearchLoading(true);
    try {
      const searchTermLower = searchTerm.toLowerCase();
      const filteredRooms = allRooms.filter(room => 
        room.course.toLowerCase().includes(searchTermLower) ||
        room.professor.toLowerCase().includes(searchTermLower)
      );
      setDisplayedRooms(filteredRooms);
      setHasSearched(true);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error searching rooms:', error);
      setError('Failed to search rooms. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  }, [searchTerm, allRooms]);

  const handleJoinRoom = async (roomId, course, professor) => {
    try {
      // Find the room in our list
      const roomIndex = allRooms.findIndex(r => r.id === roomId);
      if (roomIndex === -1) {
        throw new Error('Room not found');
      }

      // If room already has a meetLink, use it
      if (allRooms[roomIndex].meetLink) {
        window.open(allRooms[roomIndex].meetLink, '_blank');
        return;
      }

      // Create new room
      const meetLink = await createDailyRoom(`${course}-${professor}`);
      
      // Update room in our list
      const updatedRooms = [...allRooms];
      updatedRooms[roomIndex] = {
        ...updatedRooms[roomIndex],
        meetLink
      };
      setAllRooms(updatedRooms);
      
      // Only update displayedRooms if we're showing all rooms
      if (!hasSearched) {
        setDisplayedRooms(updatedRooms);
      }

      // Open Daily.co link directly
      window.open(meetLink, '_blank');
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  };

  // Calculate pagination
  const indexOfLastRoom = currentPage * roomsPerPage;
  const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
  const currentRooms = displayedRooms.slice(indexOfFirstRoom, indexOfLastRoom);
  const totalPages = Math.ceil(displayedRooms.length / roomsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    pages.push(
      <PageButton
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &lt;
      </PageButton>
    );

    // First page
    if (startPage > 1) {
      pages.push(
        <PageButton
          key={1}
          active={currentPage === 1}
          onClick={() => handlePageChange(1)}
        >
          1
        </PageButton>
      );
      if (startPage > 2) {
        pages.push(<Ellipsis key="start-ellipsis">...</Ellipsis>);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PageButton
          key={i}
          active={currentPage === i}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </PageButton>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<Ellipsis key="end-ellipsis">...</Ellipsis>);
      }
      pages.push(
        <PageButton
          key={totalPages}
          active={currentPage === totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </PageButton>
      );
    }

    // Next button
    pages.push(
      <PageButton
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        &gt;
      </PageButton>
    );

    return pages;
  };

  return (
    <DashboardContainer>
      <ContentContainer>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Search by course code or professor name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <SearchButton onClick={handleSearch} disabled={searchLoading}>
            {searchLoading ? 'Searching...' : 'Search'}
          </SearchButton>
        </SearchContainer>

        {!hasSearched && (
          <WelcomeMessage>
            <WelcomeTitle>Welcome to TerpStudySpot</WelcomeTitle>
            <WelcomeText>
              Find and join study rooms for your courses. Search by course code or professor name.
            </WelcomeText>
          </WelcomeMessage>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {hasSearched && (
          <>
            <RoomGrid>
              {currentRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onJoinRoom={handleJoinRoom}
                />
              ))}
            </RoomGrid>
            
            {totalPages > 1 && (
              <PaginationContainer>
                {renderPagination()}
              </PaginationContainer>
            )}
          </>
        )}
      </ContentContainer>

      <Footer>
        <FooterLinks>
          <FooterLink 
            href="https://docs.google.com/forms/d/e/1FAIpQLSe4kP3NtbFsf7iiMo2-bRU4EDFyIJV8H5SbbHeHplmaud7_gw/viewform?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
          >
            Give us feedback!
          </FooterLink>
          <FooterLink 
            href="https://github.com/maxxcyang/terpstudyspot"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </FooterLink>
        </FooterLinks>
        <DeveloperCredit>Developed by Maxx Yang</DeveloperCredit>
      </Footer>
    </DashboardContainer>
  );
};

export default Dashboard;