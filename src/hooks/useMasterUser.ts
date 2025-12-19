import { useEffect, useState } from 'react';

export const useMasterUser = () => {
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMasterStatus = () => {
      const masterSession = localStorage.getItem('master_session');
      setIsMaster(masterSession === 'true');
      setLoading(false);
    };

    checkMasterStatus();

    // Listen for storage changes
    const handleStorageChange = () => {
      checkMasterStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = () => {
    localStorage.removeItem('master_session');
    setIsMaster(false);
  };

  return { isMaster, loading, logout };
};
