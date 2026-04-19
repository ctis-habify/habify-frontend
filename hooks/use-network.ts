import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

// Geliştirme sırasında true yaparak offline banner'ı görebilirsiniz
const DEBUG_FORCE_OFFLINE = false;

export function useNetwork() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      // state.isConnected null ise 'bağlı' kabul ediyoruz (başlangıç durumu için)
      setIsOffline(state.isConnected === false);
    });

    return () => unsubscribe();
  }, []);

  return { isOffline: DEBUG_FORCE_OFFLINE || isOffline };
}
