import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

import { DB_TABLES } from "@/src/utils/constants";

export class Wagon extends Model {
  static table = DB_TABLES.wagons;

  @text("name") name: string;
  @text("name_search") nameSearch: string;
  @text("code") code?: string;
  @text("description") description?: string;
  @field("capacity_kg") capacityKg?: number;
  @field("inner_length_mm") innerLengthMm?: number;
  @field("inner_width_mm") innerWidthMm?: number;
  @field("inner_height_mm") innerHeightMm?: number;
  @field("created_at") createdAt: number;
  @field("updated_at") updatedAt: number;
  @field("is_deleted") isDeleted: boolean;
  @text("sync_status") syncState: string;
  @field("version") version: number;
}
