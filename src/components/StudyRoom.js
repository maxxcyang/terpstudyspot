import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { DailyVideo, useParticipantCounts, DailyProvider } from '@daily-co/daily-react';
import config from '../config';

// Create a global object to store room participant counts
window.roomParticipantCounts = window.roomParticipantCounts || {};

const RoomContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.background};
`;

const RoomHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const RoomTitle = styled.h2`
  color: ${({ theme }) => theme.colors.primary};
`;

const ParticipantCount = styled.div`
  background-color: ${({ theme }) => theme.colors.secondary};
  color: black;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: bold;
`;

const VideoContainer = styled.div`
  flex: 1;
  background-color: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
`;

const LeaveButton = styled.button`
  background-color: ${({ theme }) => theme.colors.error};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
  margin-top: 1rem;

  &:hover {
    background-color: #d32f2f;
  }
`;

const StudyRoomContent = ({ onParticipantCountChange }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const meetLink = searchParams.get('meetLink');
  const { present } = useParticipantCounts();

  useEffect(() => {
    if (meetLink) {
      // Update the global participant count for this room
      const roomId = new URL(meetLink).pathname.split('/').pop();
      window.roomParticipantCounts[roomId] = present;
      
      // Dispatch a custom event to notify Dashboard
      window.dispatchEvent(new CustomEvent('roomParticipantCountUpdate', {
        detail: { roomId, count: present }
      }));

      // Also update localStorage for persistence
      localStorage.setItem(`room_${roomId}_count`, present.toString());
    }
  }, [present, meetLink]);

  useEffect(() => {
    if (onParticipantCountChange) {
      onParticipantCountChange(present);
    }
  }, [present, onParticipantCountChange]);

  if (!meetLink) {
    return (
      <RoomContainer>
        <p style={{ color: 'red' }}>Invalid meeting link</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </RoomContainer>
    );
  }

  const handleLeaveRoom = () => {
    window.close();
  };

  return (
    <RoomContainer>
      <RoomHeader>
        <RoomTitle>Study Room</RoomTitle>
        <ParticipantCount>{present} Participants</ParticipantCount>
      </RoomHeader>

      <VideoContainer>
        <DailyVideo />
      </VideoContainer>

      <LeaveButton onClick={handleLeaveRoom}>
        Leave Room
      </LeaveButton>
    </RoomContainer>
  );
};

const StudyRoom = (props) => {
  const [dailyConfig] = React.useState(() => ({
    apiKey: config.dailyCoApiKey,
    defaults: {
      videoSource: false,
      audioSource: false,
    }
  }));

  if (!config.dailyCoApiKey) {
    return <div>Daily.co API key is missing</div>;
  }

  return (
    <DailyProvider config={dailyConfig}>
      <StudyRoomContent {...props} />
    </DailyProvider>
  );
};

export default StudyRoom; 