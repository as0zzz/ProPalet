import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

import { DB_TABLES } from "@/src/utils/constants";

export class LoadingReport extends Model {
  static table = DB_TABLES.loadingReports;

  @field("date_time") dateTime: number;
  @text("wagon_id") wagonId: string;
  @text("package_type_id") packageTypeId: string;
  @text("selected_scheme_group_key") selectedSchemeGroupKey: string;
  @text("selected_tier_ids_json") selectedTierIdsJson: string;
  @text("used_inventory_json") usedInventoryJson: string;
  @text("result_text") resultText: string;
  @text("result_html") resultHtml: string;
  @text("txt_path") txtPath?: string;
  @text("pdf_path") pdfPath?: string;
  @text("status") status: string;
  @text("operator_comment") operatorComment?: string;
  @text("operator_name") operatorName?: string;
  @field("created_at") createdAt: number;
  @field("updated_at") updatedAt: number;
  @field("is_deleted") isDeleted: boolean;
  @text("sync_status") syncState: string;
  @field("version") version: number;
}
