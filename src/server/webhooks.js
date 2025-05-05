const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const { doc, setDoc, increment } = require('firebase/firestore');

// Verify Daily.co webhook signature
const verifyWebhook = (req, res, next) => {
  const signature = req.headers['x-daily-signature'];
  if (!signature) {
    return res.status(401).send('Missing signature');
  }
  // Add your webhook verification logic here
  next();
};

router.post('/daily-webhook', verifyWebhook, async (req, res) => {
  try {
    const { event, room_name } = req.body;

    if (!room_name) {
      return res.status(400).send('Missing room_name');
    }

    const roomRef = doc(db, 'rooms', room_name);

    switch (event) {
      case 'participant-joined':
        await setDoc(roomRef, {
          onlineCount: increment(1)
        }, { merge: true });
        break;
      
      case 'participant-left':
        await setDoc(roomRef, {
          onlineCount: increment(-1)
        }, { merge: true });
        break;
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).send('Internal server error');
  }
});

module.exports = router; 