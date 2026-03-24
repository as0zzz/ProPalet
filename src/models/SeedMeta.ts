import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

import { DB_TABLES } from "@/src/utils/constants";

export class SeedMeta extends Model {
  static table = DB_TABLES.seedMeta;

  @text("seed_version") seedVersion: string;
  @field("applied_at") appliedAt: number;
  @text("checksum") checksum?: string;
}
