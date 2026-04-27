const TRANSACTIONS_STORAGE_KEY_PREFIX = "kaspi_mvp_transactions_v3";
const USER_CATALOG_STORAGE_KEY_PREFIX = "kaspi_mvp_user_catalog_v2";
const DRAFT_QUEUE_STORAGE_KEY_PREFIX = "kaspi_mvp_draft_queue_v2";
const GUEST_TRANSACTIONS_MIGRATION_KEY = "kaspi_mvp_guest_migrated_v1";
const GUEST_CATALOG_MIGRATION_KEY = "kaspi_mvp_catalog_migrated_v1";

export const LEGACY_TRANSACTIONS_STORAGE_KEY = "kaspi_mvp_transactions_v2";
export const LEGACY_USER_CATALOG_STORAGE_KEY = "kaspi_mvp_user_catalog_v1";
export const LEGACY_DRAFT_QUEUE_STORAGE_KEY = "kaspi_mvp_draft_queue_v1";
export const LEGACY_STORAGE_SCOPE_OWNER_KEY = "kaspi_mvp_legacy_scope_owner_v1";

export function normalizeStorageScope(scope?: string): string {
	const trimmed = scope?.trim();
	if (!trimmed) return "guest";
	return trimmed.replace(/[^a-zA-Z0-9_-]+/g, "_");
}

export function getTransactionsStorageKey(scope?: string): string {
	return `${TRANSACTIONS_STORAGE_KEY_PREFIX}:${normalizeStorageScope(scope)}`;
}

export function getUserCatalogStorageKey(scope?: string): string {
	return `${USER_CATALOG_STORAGE_KEY_PREFIX}:${normalizeStorageScope(scope)}`;
}

export function getDraftQueueStorageKey(scope?: string): string {
	return `${DRAFT_QUEUE_STORAGE_KEY_PREFIX}:${normalizeStorageScope(scope)}`;
}

export function clearClientAppStorage(preserveScope?: string): void {
	if (typeof window === "undefined") return;

	const keysToPreserve = preserveScope
		? new Set([
				getTransactionsStorageKey(preserveScope),
				getUserCatalogStorageKey(preserveScope),
				getDraftQueueStorageKey(preserveScope),
		  ])
		: new Set<string>();

	const removablePrefixes = [
		TRANSACTIONS_STORAGE_KEY_PREFIX,
		USER_CATALOG_STORAGE_KEY_PREFIX,
		DRAFT_QUEUE_STORAGE_KEY_PREFIX,
	];

	for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
		const key = window.localStorage.key(index);
		if (!key) continue;

		const matchesPrefix = removablePrefixes.some((prefix) => key.startsWith(`${prefix}:`));
		if (matchesPrefix && !keysToPreserve.has(key)) {
			window.localStorage.removeItem(key);
		}
	}

	window.localStorage.removeItem(LEGACY_TRANSACTIONS_STORAGE_KEY);
	window.localStorage.removeItem(LEGACY_USER_CATALOG_STORAGE_KEY);
	window.localStorage.removeItem(LEGACY_DRAFT_QUEUE_STORAGE_KEY);
	window.localStorage.removeItem(LEGACY_STORAGE_SCOPE_OWNER_KEY);
	window.localStorage.removeItem(GUEST_TRANSACTIONS_MIGRATION_KEY);
	window.localStorage.removeItem(GUEST_CATALOG_MIGRATION_KEY);
}
