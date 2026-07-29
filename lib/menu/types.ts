export type ItemSize = {
  id: string;
  item_id: string;
  label: string;
  price: number;
  sort_order: number;
};

export type MenuItemRow = {
  id: string;
  category_id: string;
  name_en: string;
  name_ar: string | null;
  description: string | null;
  price: number | null;
  is_popular: boolean;
  is_available: boolean;
  image_url: string | null;
  sort_order: number;
  item_sizes: ItemSize[];
};

export type Category = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  blurb: string | null;
  sort_order: number;
  is_active: boolean;
  menu_items: MenuItemRow[];
};

export type Menu = Category[];
