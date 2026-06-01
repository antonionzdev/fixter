export type PublicProfile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  phone: string | null;
  created_at: string;
};

export type ReviewSummary = {
  avg: number;
  count: number;
};
