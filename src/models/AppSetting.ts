import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

import { DB_TABLES } from "@/src/utils/constants";

export class AppSetting extends Model {
  static table = DB_TABLES.appSettings;

  @text("key") key: string;
  @text("value") value: string;
  @field("updated_at") updatedAt: number;
}
