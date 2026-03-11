import { useCallback, useEffect, useState } from 'react';

type ToastPayload = { message: string; icon?: 'bell' | 'check' | 'warning' };

type Listener = (payload: ToastPayload) => void;

const listeners = new Set<Listener>();

export function emitToast(message: string, icon?: ToastPayload['icon']): void {
  listeners.forEach((fn) => fn({ message, icon }));
}

export function useToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [icon, setIcon] = useState<ToastPayload['icon']>('check');

  const hide = useCallback(() => setVisible(false), []);

  useEffect(() => {
    const handler: Listener = (payload) => {
      setMessage(payload.message);
      setIcon(payload.icon ?? 'bell');
      setVisible(true);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return { visible, message, icon, hide };
}
