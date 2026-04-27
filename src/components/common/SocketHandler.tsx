'use client';

import { useEffect, useCallback, useRef } from 'react';
import useSocket from '@/hooks/useSocket';

const SocketHandler = () => {
  const listenerSetupRef = useRef(false);
  
  let adminId: string | undefined;
  try {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user_info') : null;
    if (userStr) {
      const user = JSON.parse(userStr);
      adminId = user._id || user.id;
    }
  } catch (e) {
    console.error('Error parsing admin from localStorage', e);
  }

  const { socket } = useSocket(adminId, 'admin');

  const handleAdminNotification = useCallback((notification: any) => {
    console.log('Received admin notification via socket:', notification);
    
    window.dispatchEvent(new CustomEvent('new_admin_notification', { detail: notification }));
  }, []);

  useEffect(() => {
    if (!socket || !adminId) {
      return;
    }

    console.log('Setting up admin socket listener for:', adminId);
    socket.on('new_admin_notification', handleAdminNotification);

    return () => {
      socket.off('new_admin_notification', handleAdminNotification);
    };
  }, [socket, adminId, handleAdminNotification]);

  return null;
};

export default SocketHandler;
