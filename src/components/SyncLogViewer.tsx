import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface SyncLog {
  timestamp: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface SyncLogViewerProps {
  logs: SyncLog[];
}

export const SyncLogViewer = ({ logs }: SyncLogViewerProps) => {
  if (logs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sync Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <Badge 
                  variant={
                    log.type === 'error' ? 'destructive' : 
                    log.type === 'success' ? 'default' : 
                    'secondary'
                  }
                  className="shrink-0"
                >
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Badge>
                <span className={
                  log.type === 'error' ? 'text-destructive' :
                  log.type === 'success' ? 'text-green-600 dark:text-green-400' :
                  'text-muted-foreground'
                }>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
