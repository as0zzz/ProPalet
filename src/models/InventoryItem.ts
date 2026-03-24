import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

import { DB_TABLES } from "@/src/utils/constants";

export class InventoryItem extends Model {
  static table = DB_TABLES.inventoryItems;

  @text("name") name: string;
  @text("name_search") nameSearch: string;
  @field("quantity") quantity: number;
  @text("configuration") configuration: string;
  @text("image_key") imageKey?: string;
  @text("unit_of_measure") unitOfMeasure: string;
  @field("created_at") createdAt: number;
  @field("updated_at") updatedAt: number;
  @field("is_deleted") isDeleted: boolean;
  @text("sync_status") syncState: string;
  @field("version") version: number;
}
