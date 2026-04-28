import { useEffect, useState } from 'react';
import { ColorSchemeName, useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme(): ColorSchemeName {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
