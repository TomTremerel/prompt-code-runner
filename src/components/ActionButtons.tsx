import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Wand2, 
  RotateCcw, 
  Zap,
  Settings 
} from "lucide-react";

interface ActionButtonsProps {
  onModify: () => void;
  onReset: () => void;
  onOptimize: () => void;
  onSettings: () => void;
  hasCode: boolean;
  isLoading: boolean;
}

export function ActionButtons({ 
  onModify, 
  onReset, 
  onOptimize, 
  onSettings, 
  hasCode, 
  isLoading 
}: ActionButtonsProps) {
  return (
    <Card className="bg-secondary/30 border-border/30">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onModify}
            disabled={!hasCode || isLoading}
            variant="outline"
            className="bg-background/10 border-primary/30 hover:bg-primary/10 hover:border-primary"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          
          <Button
            onClick={onOptimize}
            disabled={!hasCode || isLoading}
            variant="outline"
            className="bg-background/10 border-warning/30 hover:bg-warning/10 hover:border-warning"
          >
            <Zap className="h-4 w-4 mr-2" />
            Optimiser
          </Button>
          
          <Button
            onClick={onReset}
            disabled={isLoading}
            variant="outline"
            className="bg-background/10 border-border/30 hover:bg-destructive/10 hover:border-destructive"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <Button
            onClick={onSettings}
            variant="outline"
            className="bg-background/10 border-border/30 hover:bg-accent/10 hover:border-accent"
          >
            <Settings className="h-4 w-4 mr-2" />
            Options
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}