import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

import { DB_TABLES } from "@/src/utils/constants";

export class SchemeInventory extends Model {
  static table = DB_TABLES.schemeInventories;

  @text("loading_scheme_id") loadingSchemeId: string;
  @text("inventory_item_id") inventoryItemId: string;
  @field("units_count") unitsCount: number;
  @text("note") note?: string;
  @field("created_at") createdAt: number;
  @field("updated_at") updatedAt: number;
}
