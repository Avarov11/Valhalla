export type ItemSize = {
  id: string;
  item_id: string;
  label: string;
  price: number;
  sort_order: number;
};

export type AddonOption = {
  id: string;
  group_id: string;
  name_en: string;
  name_ar: string | null;
  price_delta: number;
  is_available: boolean;
  sort_order: number;
};

export type AddonGroup = {
  id: string;
  item_id: string;
  name_en: string;
  name_ar: string | null;
  is_required: boolean;
  allows_multiple: boolean;
  sort_order: number;
  item_addon_options: AddonOption[];
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
  /** Owner-entered aggregate, real data pulled from wherever the
   * owner's actual reviews live (Google, Facebook, etc.), never
   * fabricated by the app. null/0 means no rating yet; the UI must
   * not render a star row in that case, not show a fake default. */
  rating_average: number | null;
  rating_count: number;
  item_sizes: ItemSize[];
  item_addon_groups: AddonGroup[];
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
