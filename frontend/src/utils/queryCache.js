// Simple in-memory cache for Supabase queries to reduce network calls
class SupabaseQueryCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  generateKey(table, filter) {
    return `${table}:${JSON.stringify(filter)}`;
  }

  get(table, filter) {
    const key = this.generateKey(table, filter);
    const cached = this.cache.get(key);

    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(table, filter, data) {
    const key = this.generateKey(table, filter);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }

  clearTable(table) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${table}:`)) {
        this.cache.delete(key);
      }
    }
  }
}

export const queryCache = new SupabaseQueryCache();

// Helper function to query with cache
export async function cachedQuery(supabaseQuery, table, filter = {}) {
  // Try to get from cache first
  const cachedData = queryCache.get(table, filter);
  if (cachedData) {
    console.log(`Using cached data for ${table}`);
    return cachedData;
  }

  // Execute query
  const { data, error } = await supabaseQuery;

  if (error) throw error;

  // Cache the result
  queryCache.set(table, filter, data);
  console.log(`Cached data for ${table}`);

  return data;
}
