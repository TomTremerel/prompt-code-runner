import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Send } from "lucide-react";

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  isLoading?: boolean;
}

export function PromptInput({ onGenerate, isLoading = false }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading) {
      onGenerate(prompt.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="bg-gradient-primary border-primary/20">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary-foreground">
            <Sparkles className="h-5 w-5" />
            <h3 className="font-semibold">Prompt d'instruction</h3>
          </div>
          
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Décrivez le code que vous voulez générer... Ex: Créer une fonction Python qui trie une liste de nombres"
            className="min-h-[120px] bg-background/10 border-primary/30 text-primary-foreground placeholder:text-primary-foreground/70 focus:border-primary-glow"
            disabled={isLoading}
          />
          
          <div className="flex justify-between items-center">
            <p className="text-xs text-primary-foreground/70">
              Ctrl+Entrée pour exécuter
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isLoading}
              variant="secondary"
              className="bg-background/20 hover:bg-background/30 border-primary/30"
            >
              {isLoading ? (
                <div className="animate-pulse-subtle">Génération...</div>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Générer
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}