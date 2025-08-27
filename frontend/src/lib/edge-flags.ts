// Simplified edge-flags for development
// Remove dependency on flags/next and @vercel/edge-config that may not be installed

export type IMaintenanceNotice =
  | {
      enabled: true;
      startTime: Date;
      endTime: Date;
    }
  | {
      enabled: false;
      startTime?: undefined;
      endTime?: undefined;
    };

// Mock flag function for development
function flag<T>(config: { key: string; decide: () => Promise<T> | T }) {
  return {
    key: config.key,
    decide: config.decide,
    value: async () => {
      try {
        return await config.decide();
      } catch (error) {
        console.warn(`Flag ${config.key} failed:`, error);
        return null;
      }
    }
  };
}

export const maintenanceNoticeFlag = flag({
  key: 'maintenance-notice',
  async decide() {
    // Always return disabled in development
    return { enabled: false } as const;
  },
});
