export type CoarsePresence = {
  uid: string;
  geohash: string;
  activityType: 'run' | 'walk' | 'ride';
  paceBucket?: string;
  joinable: boolean;
  updatedAt: number;
};

export type LiveSession = {
  id: string;
  ownerId: string;
  visibility: 'private' | 'friends' | 'public_coarse' | 'joinable';
  participantIds: string[];
  activityType: 'run' | 'walk' | 'ride';
  startedAt: number;
};

// Precise coordinates intentionally do not belong in CoarsePresence.
