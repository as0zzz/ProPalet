import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

import { DB_TABLES } from "@/src/utils/constants";

export class PackageType extends Model {
  static table = DB_TABLES.packageTypes;

  @field("package_type_number") packageTypeNumber: number;
  @text("construction_variant") constructionVariant: string;
  @field("nominal_ingot_mass_kg") nominalIngotMassKg: number;
  @field("ingot_height_mm") ingotHeightMm: number;
  @text("package_dimensions") packageDimensions: string;
  @field("leg_height_mm") legHeightMm: number;
  @field("leg_base_mm") legBaseMm: number;
  @field("nominal_package_mass_kg") nominalPackageMassKg: number;
  @field("package_mass_deviation_kg") packageMassDeviationKg: number;
  @text("search_label") searchLabel: string;
  @field("created_at") createdAt: number;
  @field("updated_at") updatedAt: number;
  @field("is_deleted") isDeleted: boolean;
  @text("sync_status") syncState: string;
  @field("version") version: number;
}
