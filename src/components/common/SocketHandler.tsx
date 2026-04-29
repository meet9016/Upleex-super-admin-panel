'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import useSocket from '@/hooks/useSocket';

const SocketHandler = () => {
  const [adminId, setAdminId] = useState<string | undefined>(undefined);

  const loadAdminId = () => {
    try {
      const userStr = localStorage.getItem('user_info');
      if (userStr) {
        const user = JSON.parse(userStr);
        const id = user._id || user.id;
        setAdminId(id || undefined);
      } else {
        setAdminId(undefined);
      }
    } catch (e) {
      setAdminId(undefined);
    }
  };

  useEffect(() => {
    loadAdminId();
    window.addEventListener('storage', loadAdminId);
    window.addEventListener('adminLoggedIn', loadAdminId);
    window.addEventListener('adminLoggedOut', loadAdminId);
    return () => {
      window.removeEventListener('storage', loadAdminId);
      window.removeEventListener('adminLoggedIn', loadAdminId);
      window.removeEventListener('adminLoggedOut', loadAdminId);
    };
  }, []);

  const { socket } = useSocket(adminId, 'admin');

  const handleAdminNotification = useCallback((notification: any) => {
    console.log('Received admin notification via socket:', notification);
    
    window.dispatchEvent(new CustomEvent('new_admin_notification', { detail: notification }));
  }, []);

  useEffect(() => {
    if (!socket || !adminId) return;
     console.log('Setting up admin socket listener for:', adminId);
    socket.on('new_admin_notification', handleAdminNotification);
    return () => { socket.off('new_admin_notification', handleAdminNotification); };
  }, [socket, adminId, handleAdminNotification]);

  return null;
};

export default SocketHandler;
