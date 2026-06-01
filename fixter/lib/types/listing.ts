export type SellerListing = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  brand: string | null;
  model: string | null;
  condition: string | null;
  location: string | null;
  images: string[];
  status: string;
  created_at: string;
};

export type ListingDetailProfile = {
  username: string;
  avatar_url: string | null;
  location: string;
  created_at: string;
};

export type ListingDetailWithSeller = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  model: string;
  condition: string;
  location: string;
  images: string[];
  specs: Record<string, string> | null;
  status: string;
  created_at: string;
  profiles: ListingDetailProfile | null;
};

export type ListingRow = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  brand: string | null;
  model: string | null;
  condition: string | null;
  location: string | null;
  images: string[];
  created_at: string;
};

export type ListingInsert = {
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  model: string;
  condition: string;
  location: string;
  images: string[];
  status?: string;
};

export type ListingWithSeller = ListingRow & {
  profiles: Record<string, unknown> | null;
};

export type PublishListingInput = {
  title: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  model: string;
  condition: string;
  location: string;
};

export type ListingFilters = {
  search?: string;
  category?: string;
  model?: string;
  condition?: string;
  price_min?: number;
  price_max?: number;
  specs?: Record<string, string>;
};
