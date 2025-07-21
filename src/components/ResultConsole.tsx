import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Terminal, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Trash2,
  Play
} from "lucide-react";

interface ExecutionResult {
  stdout?: string;
  stderr?: string;
  exitCode: number;
  executionTime?: number;
  timestamp: Date;
}

interface ResultConsoleProps {
  result: ExecutionResult | null;
  isExecuting: boolean;
  onClear: () => void;
  onExecute: () => void;
  language: string;
}

export function ResultConsole({ 
  result, 
  isExecuting, 
  onClear, 
  onExecute,
  language 
}: ResultConsoleProps) {
  const getStatusBadge = () => {
    if (isExecuting) {
      return (
        <Badge variant="secondary" className="animate-pulse-subtle">
          <div className="animate-glow">En cours...</div>
        </Badge>
      );
    }
    
    if (!result) {
      return (
        <Badge variant="outline" className="border-muted-foreground/30">
          Aucune exécution
        </Badge>
      );
    }

    if (result.exitCode === 0) {
      return (
        <Badge variant="default" className="bg-success text-success-foreground">
          <CheckCircle className="h-3 w-3 mr-1" />
          Succès
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Erreur ({result.exitCode})
        </Badge>
      );
    }
  };

  const getConsoleContent = () => {
    if (isExecuting) {
      return (
        <div className="animate-fade-in text-muted-foreground">
          <div className="animate-pulse-subtle">
            Exécution du code {language} en cours...
          </div>
        </div>
      );
    }

    if (!result) {
      return (
        <div className="text-muted-foreground text-center py-8">
          <Terminal className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Aucun résultat d'exécution</p>
          <p className="text-sm">Cliquez sur "Exécuter" pour lancer le code</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {result.stdout && (
          <div>
            <div className="text-xs text-success mb-1 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              SORTIE STANDARD
            </div>
            <pre className="text-sm bg-background/20 border border-success/30 rounded p-3 overflow-auto">
              {result.stdout}
            </pre>
          </div>
        )}

        {result.stderr && (
          <div>
            <div className="text-xs text-destructive mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              ERREURS
            </div>
            <pre className="text-sm bg-background/20 border border-destructive/30 rounded p-3 overflow-auto text-destructive">
              {result.stderr}
            </pre>
          </div>
        )}

        <div className="flex justify-between text-xs text-muted-foreground border-t border-border/30 pt-3">
          <span>
            Temps d'exécution: {result.executionTime ? `${result.executionTime}ms` : 'N/A'}
          </span>
          <span>
            {result.timestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-console-bg border-border/50 animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Console de résultats</h3>
          {getStatusBadge()}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={onExecute}
            disabled={isExecuting}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <Play className="h-4 w-4 mr-2" />
            Exécuter
          </Button>
          
          {result && (
            <Button
              onClick={onClear}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="bg-gradient-console rounded-lg p-4 min-h-[200px]">
          {getConsoleContent()}
        </div>
      </CardContent>
    </Card>
  );
}