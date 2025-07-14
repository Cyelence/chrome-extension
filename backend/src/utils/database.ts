import { PrismaClient } from '@prisma/client';
import { dbLogger } from '@/utils/logger';
import { isDevelopment } from '@/config';

/**
 * Global Prisma client instance
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Database connection options
 */
const databaseOptions = {
  log: isDevelopment() ? ['query', 'info', 'warn', 'error'] as const : ['warn', 'error'] as const,
  errorFormat: 'pretty' as const
};

/**
 * Create Prisma client instance
 */
const createPrismaClient = (): PrismaClient => {
  const client = new PrismaClient(databaseOptions);
  
  // Add query logging middleware
  client.$use(async (params: any, next: any) => {
    const start = Date.now();
    const result = await next(params);
    const duration = Date.now() - start;
    
    dbLogger.debug('Database Query', {
      model: params.model,
      action: params.action,
      duration: `${duration}ms`
    });
    
    return result;
  });
  
  return client;
};

/**
 * Get or create Prisma client instance
 */
export const prisma = globalThis.__prisma || createPrismaClient();

// In development, save the client to global to avoid multiple instances
if (isDevelopment()) {
  globalThis.__prisma = prisma;
}

/**
 * Connect to database
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    dbLogger.info('Database connected successfully');
  } catch (error) {
    dbLogger.error('Failed to connect to database', { error });
    throw error;
  }
};

/**
 * Disconnect from database
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    dbLogger.info('Database disconnected successfully');
  } catch (error) {
    dbLogger.error('Failed to disconnect from database', { error });
    throw error;
  }
};

/**
 * Health check for database connection
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    dbLogger.error('Database health check failed', { error });
    return false;
  }
};

/**
 * Database transaction helper
 */
export const transaction = async <T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> => {
  try {
    return await prisma.$transaction(callback);
  } catch (error) {
    dbLogger.error('Database transaction failed', { error });
    throw error;
  }
};

/**
 * Database utility functions
 */
export const dbUtils = {
  /**
   * Execute raw SQL query
   */
  raw: async <T = unknown>(query: string, ...params: unknown[]): Promise<T> => {
    try {
      const result = await prisma.$queryRawUnsafe(query, ...params);
      return result as T;
    } catch (error) {
      dbLogger.error('Raw query failed', { query, error });
      throw error;
    }
  },

  /**
   * Get database statistics
   */
  getStats: async (): Promise<Record<string, number>> => {
    try {
      const [
        userCount,
        itemCount,
        collectionCount,
        sessionCount
      ] = await Promise.all([
        prisma.user.count(),
        prisma.item.count(),
        prisma.collection.count(),
        prisma.session.count()
      ]);

      return {
        users: userCount,
        items: itemCount,
        collections: collectionCount,
        sessions: sessionCount
      };
    } catch (error) {
      dbLogger.error('Failed to get database statistics', { error });
      throw error;
    }
  },

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions: async (): Promise<number> => {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isActive: false }
          ]
        }
      });

      dbLogger.info('Cleaned up expired sessions', { count: result.count });
      return result.count;
    } catch (error) {
      dbLogger.error('Failed to cleanup expired sessions', { error });
      throw error;
    }
  },

  /**
   * Cleanup old audit logs
   */
  cleanupAuditLogs: async (daysToKeep: number = 90): Promise<number> => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      dbLogger.info('Cleaned up old audit logs', { count: result.count, daysToKeep });
      return result.count;
    } catch (error) {
      dbLogger.error('Failed to cleanup audit logs', { error });
      throw error;
    }
  },

  /**
   * Get database size information
   */
  getDatabaseSize: async (): Promise<Record<string, unknown>> => {
    try {
      const sizeQuery = `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
      `;

      const result = await prisma.$queryRawUnsafe(sizeQuery);
      return result as Record<string, unknown>;
    } catch (error) {
      dbLogger.error('Failed to get database size', { error });
      throw error;
    }
  }
};

/**
 * Graceful shutdown for database
 */
export const gracefulShutdown = async (): Promise<void> => {
  try {
    await disconnectDatabase();
    dbLogger.info('Database gracefully shut down');
  } catch (error) {
    dbLogger.error('Error during database shutdown', { error });
  }
};

/**
 * Initialize database connection
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    await connectDatabase();
    
    // Run health check
    const isHealthy = await checkDatabaseHealth();
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }
    
    // Log database stats in development
    if (isDevelopment()) {
      const stats = await dbUtils.getStats();
      dbLogger.info('Database statistics', stats);
    }
  } catch (error) {
    dbLogger.error('Failed to initialize database', { error });
    throw error;
  }
};

export default prisma; 