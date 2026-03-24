import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

import { DB_TABLES } from "@/src/utils/constants";

export class SyncQueue extends Model {
  static table = DB_TABLES.syncQueue;

  @text("entity_type") entityType: string;
  @text("entity_id") entityId: string;
  @text("operation") operation: string;
  @text("payload_json") payloadJson: string;
  @text("status") status: string;
  @field("attempts") attempts: number;
}
