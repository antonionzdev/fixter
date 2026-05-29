export type ListingRow = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  brand: string | null;
  model: string | null;
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
  location: string;
  images: string[];
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
  location: string;
};
