export type ActivityType = 'run' | 'walk' | 'ride';
export type ActivityPrivacy = 'private' | 'friends' | 'public';
export type JoinRequestStatus = 'requested' | 'accepted' | 'declined' | 'cancelled' | 'expired';

export type PacerRequest = {
  requesterId: string;
  distanceM: number;
  targetPaceSecPerKm: number;
  startMode: 'now' | 'scheduled';
  startAt?: string;
};
