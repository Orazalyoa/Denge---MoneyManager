import type { UserCatalog } from "@/domain/transactions/catalog";
import { EMPTY_USER_CATALOG } from "@/domain/transactions/catalog";
import { supabase } from "@/lib/supabase";

interface SupabaseCatalogRow {
  user_id: string;
  catalog: UserCatalog;
  updated_at: string;
}

export class SupabaseCatalogRepository {
  constructor(private readonly userId: string) {}

  async getCatalog(): Promise<UserCatalog> {
    if (!supabase) return EMPTY_USER_CATALOG;

    const { data, error } = await supabase
      .from("user_catalogs")
      .select("catalog")
      .eq("user_id", this.userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch catalog from Supabase", error);
      return EMPTY_USER_CATALOG;
    }

    const row = data as Pick<SupabaseCatalogRow, "catalog"> | null;
    return row?.catalog ?? EMPTY_USER_CATALOG;
  }

  async saveCatalog(catalog: UserCatalog): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase.from("user_catalogs").upsert(
      {
        user_id: this.userId,
        catalog,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      console.error("Failed to save catalog to Supabase", error);
      throw error;
    }
  }
}
