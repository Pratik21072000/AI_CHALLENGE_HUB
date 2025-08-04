// MySQL Status Indicator - Shows if cross-device sync is active
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Wifi, WifiOff } from 'lucide-react';
import { storageService } from '@/services/storageService';
import { mysqlStorageService } from '@/services/mysqlStorageService';

export default function MySQLStatusIndicator() {
  const [isMySQL, setIsMySQL] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      setIsLoading(true);
      
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mysqlActive = storageService.isUsingMySQL();
      setIsMySQL(mysqlActive);
      setIsLoading(false);
    };

    checkStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-64 border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm text-gray-600">Checking storage...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-64 ${isMySQL ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'} shadow-sm`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className={`w-4 h-4 ${isMySQL ? 'text-green-600' : 'text-yellow-600'}`} />
              <span className="text-sm font-medium text-gray-700">
                {isMySQL ? 'MySQL Active' : 'Local Storage'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {isMySQL ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-yellow-600" />
              )}
              <Badge variant={isMySQL ? 'default' : 'secondary'} className="text-xs">
                {isMySQL ? 'Synced' : 'Device Only'}
              </Badge>
            </div>
          </div>
          <div className="mt-1">
            <p className="text-xs text-gray-600">
              {isMySQL 
                ? 'Data syncs across all your devices' 
                : 'Data stored on this device only'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
