import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

import { DB_TABLES } from "@/src/utils/constants";

export class LoadingScheme extends Model {
  static table = DB_TABLES.loadingSchemes;

  @text("group_key") groupKey: string;
  @text("name") name: string;
  @text("description") description?: string;
  @text("image_key") imageKey: string;
  @field("tiers_count") tiersCount: number;
  @field("tier_order_number") tierOrderNumber: number;
  @text("wagon_id") wagonId: string;
  @text("package_type_id") packageTypeId: string;
  @text("instruction_text") instructionText: string;
  @text("tier_note") tierNote?: string;
  @field("is_active") isActive: boolean;
  @field("version") version: number;
  @field("created_at") createdAt: number;
  @field("updated_at") updatedAt: number;
  @field("is_deleted") isDeleted: boolean;
  @text("sync_status") syncState: string;
}
