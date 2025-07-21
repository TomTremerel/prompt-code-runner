import { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { CodeEditor } from "@/components/CodeEditor";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ResultConsole } from "@/components/ResultConsole";
import { useToast } from "@/hooks/use-toast";

interface ExecutionResult {
  stdout?: string;
  stderr?: string;
  exitCode: number;
  executionTime?: number;
  timestamp: Date;
}

export default function CodePlayground() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const { toast } = useToast();

  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, language }),
      });
      const data = await response.json();
      if (response.ok) {
        setCode(data.code);
        toast({
          title: "Code généré !",
          description: `Code ${language} créé avec succès`,
        });
      } else {
        throw new Error(data.error || "Erreur lors de la génération du code");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecute = async () => {
    if (!code.trim()) {
      toast({
        title: "Erreur",
        description: "Aucun code à exécuter",
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);
    setShowConsole(true);
    try {
      const response = await fetch("http://localhost:5000/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, language }),
      });
      const data = await response.json();
       if (response.ok) {
        setExecutionResult({ ...data, timestamp: new Date(data.timestamp) });
        toast({
          title: "Code exécuté",
          description: "L'exécution s'est terminée",
        });
      } else {
        throw new Error(data.error || "Erreur lors de l'exécution du code");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleModify = () => {
    // TODO: Ouvrir une modale pour modification
    toast({
      title: "Modification",
      description: "Fonction de modification à implémenter",
    });
  };

  const handleReset = () => {
    setCode("");
    setExecutionResult(null);
    setIsEditable(false);
    setShowConsole(false);
    toast({
      title: "Réinitialisé",
      description: "L'espace de travail a été vidé",
    });
  };

  const handleOptimize = () => {
    // TODO: Optimisation du code
    toast({
      title: "Optimisation",
      description: "Fonction d'optimisation à implémenter",
    });
  };

  const handleSettings = () => {
    // TODO: Ouvrir les paramètres
    toast({
      title: "Paramètres",
      description: "Panneau de paramètres à implémenter",
    });
  };

  const handleClearConsole = () => {
    setExecutionResult(null);
    setShowConsole(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Panel gauche - Chat */}
      <div className="w-1/2 border-r border-border/30 flex flex-col">
        <div className="flex-1">
          <ChatInterface
            onGenerate={handleGenerate}
            onModify={handleModify}
            onOptimize={handleOptimize}
            onReset={handleReset}
            onSettings={handleSettings}
            hasCode={!!code}
            isLoading={isGenerating}
          />
        </div>
        
        <div className="flex-shrink-0 p-4 border-t border-border/30 bg-card/30">
          <LanguageSelector 
            value={language} 
            onValueChange={setLanguage} 
          />
        </div>
      </div>

      {/* Panel droit - Code et Console */}
      <div className="w-1/2 flex flex-col">
        <div className={`${showConsole ? 'flex-1' : 'h-full'} overflow-hidden`}>
          <div className="h-full p-4">
            <CodeEditor
              code={code}
              language={language}
              onCodeChange={setCode}
              isEditable={isEditable}
              onToggleEdit={() => setIsEditable(!isEditable)}
            />
          </div>
        </div>
        
        {showConsole && (
          <div className="flex-1 border-t border-border/30">
            <div className="h-full p-4">
              <ResultConsole
                result={executionResult}
                isExecuting={isExecuting}
                onClear={handleClearConsole}
                onExecute={handleExecute}
                language={language}
              />
            </div>
          </div>
        )}
        
        {!showConsole && (
          <div className="flex-shrink-0 p-4 border-t border-border/30 bg-card/30">
            <button 
              onClick={handleExecute}
              disabled={!code.trim() || isExecuting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting ? 'Exécution...' : 'Exécuter le code'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
