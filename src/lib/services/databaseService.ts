import { supabase } from '../../lib/supabaseClient';

export interface DatabaseStats {
  totalSize: number;
  tableCount: number;
  indexSize: number;
  cacheHitRatio: number;
  activeConnections: number;
}

export interface PlanLimits {
  maxStorage: number;      // in bytes
  maxTables: number;
  maxConnections: number;
  maxIndexSize: number;    // in bytes
}

export interface DatabaseUsage {
  stats: DatabaseStats;
  limits: PlanLimits;
  usagePercentages: {
    storage: number;
    tables: number;
    connections: number;
    indexSize: number;
  };
}

// Define your plan limits here
const PLAN_LIMITS: PlanLimits = {
  maxStorage: 1 * 1024 * 1024 * 1024,    // 1GB
  maxTables: 100,
  maxConnections: 50,
  maxIndexSize: 500 * 1024 * 1024,       // 500MB
};

export const databaseService = {
  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      // Get database size
      const { data: sizeData, error: sizeError } = await supabase
        .rpc('get_database_size');

      // Get table count
      const { data: tableData, error: tableError } = await supabase
        .rpc('get_table_count');

      // Get index size
      const { data: indexData, error: indexError } = await supabase
        .rpc('get_index_size');

      // Get cache hit ratio
      const { data: cacheData, error: cacheError } = await supabase
        .rpc('get_cache_hit_ratio');

      // Get active connections
      const { data: connData, error: connError } = await supabase
        .rpc('get_active_connections');

      if (sizeError || tableError || indexError || cacheError || connError) {
        throw new Error('Failed to fetch database stats');
      }

      return {
        totalSize: sizeData || 0,
        tableCount: tableData || 0,
        indexSize: indexData || 0,
        cacheHitRatio: cacheData || 0,
        activeConnections: connData || 0,
      };
    } catch (error) {
      console.error('Error fetching database stats:', error);
      throw error;
    }
  },

  async getDatabaseUsage(): Promise<DatabaseUsage> {
    const stats = await this.getDatabaseStats();
    
    const usagePercentages = {
      storage: (stats.totalSize / PLAN_LIMITS.maxStorage) * 100,
      tables: (stats.tableCount / PLAN_LIMITS.maxTables) * 100,
      connections: (stats.activeConnections / PLAN_LIMITS.maxConnections) * 100,
      indexSize: (stats.indexSize / PLAN_LIMITS.maxIndexSize) * 100,
    };

    return {
      stats,
      limits: PLAN_LIMITS,
      usagePercentages,
    };
  },
}; 