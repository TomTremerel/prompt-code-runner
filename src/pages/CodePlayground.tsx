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

  // Simulation de génération de code
  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    
    // Simulation d'appel API
    setTimeout(() => {
      const sampleCode = generateSampleCode(prompt, language);
      setCode(sampleCode);
      setIsGenerating(false);
      toast({
        title: "Code généré !",
        description: `Code ${language} créé avec succès`,
      });
    }, 2000);
  };

  // Simulation d'exécution
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
    
    // Simulation d'exécution
    setTimeout(() => {
      const result: ExecutionResult = {
        stdout: `Exécution du code ${language} réussie!\nRésultat: Hello, World!`,
        stderr: "",
        exitCode: 0,
        executionTime: Math.floor(Math.random() * 1000) + 100,
        timestamp: new Date()
      };
      
      setExecutionResult(result);
      setIsExecuting(false);
      toast({
        title: "Code exécuté",
        description: "L'exécution s'est terminée avec succès",
      });
    }, 1500);
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

// Fonction utilitaire pour générer du code d'exemple
function generateSampleCode(prompt: string, language: string): string {
  const samples: Record<string, string> = {
    python: `# Code généré basé sur: "${prompt}"
def main():
    print("Hello, World!")
    result = calculate_something()
    return result

def calculate_something():
    # Votre logique ici
    return 42

if __name__ == "__main__":
    main()`,
    
    javascript: `// Code généré basé sur: "${prompt}"
function main() {
    console.log("Hello, World!");
    const result = calculateSomething();
    return result;
}

function calculateSomething() {
    // Votre logique ici
    return 42;
}

main();`,
    
    bash: `#!/bin/bash
# Code généré basé sur: "${prompt}"

echo "Hello, World!"

calculate_something() {
    # Votre logique ici
    echo 42
}

result=$(calculate_something)
echo "Résultat: $result"`
  };

  return samples[language] || samples.python;
}