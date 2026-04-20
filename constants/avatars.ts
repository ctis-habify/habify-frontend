export interface Avatar {
  id: string;
  uri: string;
}

export const AVATARS: Avatar[] = [
  { id: 'avatar1', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Felix' },
  { id: 'avatar2', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka' },
  { id: 'avatar3', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Bob' },
  { id: 'avatar4', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Jack' },
  { id: 'avatar5', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Molly' },
];

export const getAvatarUri = (id?: string, seed?: string): string => {
  const avatar = AVATARS.find((a) => a.id === id);
  if (avatar) return avatar.uri;
  return `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(seed || 'User')}`;
};
