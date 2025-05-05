import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, onSnapshot, collection, query, getDocs, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const RoomContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
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

const OnlineCount = styled.div`
  background-color: ${({ theme }) => theme.colors.secondary};
  color: black;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: bold;
`;

const GoalsContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const GoalsTitle = styled.h3`
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1rem;
`;

const GoalInput = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: 4px;
  font-size: 1rem;
  margin-bottom: 1rem;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.secondary};
  }
`;

const SaveButton = styled.button`
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

const StudentsList = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const StudentItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }
`;

const StudentName = styled.span`
  font-weight: bold;
`;

const StudentGoal = styled.span`
  color: #666;
`;

const StudyRoom = () => {
  const { roomId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [goal, setGoal] = useState('');
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchRoom = async () => {
      try {
        const roomRef = doc(db, 'rooms', roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
          setError('Room not found');
          return;
        }

        setRoom(roomSnap.data());

        // Subscribe to real-time updates
        const unsubscribe = onSnapshot(roomRef, (doc) => {
          if (doc.exists()) {
            setRoom(doc.data());
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching room:', error);
        setError('Failed to load room');
      }
    };

    fetchRoom();
  }, [roomId, navigate, currentUser]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsRef = collection(db, 'rooms', roomId, 'students');
        const q = query(studentsRef);
        const querySnapshot = await getDocs(q);
        const studentsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStudents(studentsData);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    if (roomId) {
      fetchStudents();
    }
  }, [roomId]);

  useEffect(() => {
    // Add user to room's students collection when they join
    const addUserToRoom = async () => {
      try {
        if (!currentUser || !roomId) return;

        const studentRef = doc(db, 'rooms', roomId, 'students', currentUser.uid);
        await setDoc(studentRef, {
          name: currentUser.displayName || currentUser.email.split('@')[0],
          joinedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        });

        // Update room's online count
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          onlineCount: students.length + 1
        });
      } catch (error) {
        console.error('Error adding user to room:', error);
      }
    };

    addUserToRoom();
  }, [roomId, currentUser, students.length]);

  const handleSaveGoal = async () => {
    try {
      if (!currentUser || !roomId) return;

      const studentRef = doc(db, 'rooms', roomId, 'students', currentUser.uid);
      await updateDoc(studentRef, {
        goal,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  if (error) {
    return (
      <RoomContainer>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </RoomContainer>
    );
  }

  if (!room) {
    return <RoomContainer>Loading...</RoomContainer>;
  }

  return (
    <RoomContainer>
      <RoomHeader>
        <RoomTitle>{room.course} - {room.professor}</RoomTitle>
        <OnlineCount>{students.length} Students Online</OnlineCount>
      </RoomHeader>

      <GoalsContainer>
        <GoalsTitle>Your Study Goals</GoalsTitle>
        <GoalInput
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="What are you working on today?"
        />
        <SaveButton onClick={handleSaveGoal}>Save Goals</SaveButton>
      </GoalsContainer>

      <StudentsList>
        <h3>Students in Room</h3>
        {students.map((student) => (
          <StudentItem key={student.id}>
            <StudentName>{student.name}</StudentName>
            <StudentGoal>{student.goal || 'No goal set'}</StudentGoal>
          </StudentItem>
        ))}
      </StudentsList>
    </RoomContainer>
  );
};

export default StudyRoom; 