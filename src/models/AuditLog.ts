import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

import { DB_TABLES } from "@/src/utils/constants";

export class AuditLog extends Model {
  static table = DB_TABLES.auditLogs;

  @text("entity_type") entityType: string;
  @text("entity_id") entityId: string;
  @text("action") action: string;
  @text("payload_json") payloadJson: string;
  @field("created_at") createdAt: number;
}
