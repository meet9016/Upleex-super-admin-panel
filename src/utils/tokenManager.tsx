// Save token to BOTH localStorage AND cookies
export const saveToken = (token: string) => {
  // Save to localStorage (for client-side access)
  localStorage.setItem('auth_token', token);

  // Save to cookies (for middleware/server-side access)
  const expiryDays = 7;
  const date = new Date();
  date.setTime(date.getTime() + expiryDays * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  
  // Check if running on HTTPS (production) or HTTP (local)
  const isSecure = window.location.protocol === 'https:';
  const securePart = isSecure ? ';Secure' : '';
  const sameSite = isSecure ? 'Strict' : 'Lax';

  document.cookie = `auth_token=${token};${expires};path=/;SameSite=${sameSite}${securePart}`;
};

// Get token from localStorage
export const getToken = (): string | null => {
  const encrypted = localStorage.getItem('auth_token');
  return encrypted;
};

// Clear token from BOTH localStorage AND cookies
export const clearToken = () => {
  // Remove from localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_info');

  // Remove from cookies - need to match the same attributes used when setting
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const securePart = isSecure ? ';Secure' : '';
  const sameSite = isSecure ? 'Strict' : 'Lax';
  
  document.cookie = `auth_token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=${sameSite}${securePart}`;
};  

export const getUser = () => {
  const user = localStorage.getItem("user_info");
  return user ? JSON.parse(user) : null;
};
