// Data Persistence Monitor Utility
// Logs all localStorage operations for debugging and confirmation

export const DataPersistenceMonitor = {
  logStorageOperation: (operation: string, key: string, dataLength?: number) => {
    const timestamp = new Date().toLocaleTimeString();
    if (dataLength !== undefined) {
      console.log(`🔄 [${timestamp}] ${operation}: ${key} (${dataLength} records)`);
    } else {
      console.log(`🔄 [${timestamp}] ${operation}: ${key}`);
    }
  },

  logSuccessfulSave: (dataType: string, count: number) => {
    console.log(`✅ ${dataType} successfully saved: ${count} records`);
  },

  logSuccessfulLoad: (dataType: string, count: number) => {
    console.log(`�� ${dataType} successfully loaded: ${count} records`);
  },

  logDataAction: (action: string, details: string) => {
    console.log(`🎯 ${action}: ${details}`);
  },

  // Get localStorage usage summary
  getStorageSummary: () => {
    const keys = ['challenges', 'challengeHub_acceptances', 'challengeHub_submissions', 'challengeHub_reviews'];
    const summary = keys.map(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          return `${key}: ${Array.isArray(parsed) ? parsed.length : 'N/A'} records`;
        } catch {
          return `${key}: Invalid data`;
        }
      }
      return `${key}: No data`;
    });
    
    console.log('📊 localStorage Summary:');
    summary.forEach(item => console.log(`   ${item}`));
    return summary;
  }
};

// Expose globally for debugging
(window as any).DataPersistenceMonitor = DataPersistenceMonitor;
