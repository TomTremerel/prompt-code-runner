import { useState } from "react";
import { PromptInput } from "@/components/PromptInput";
import { CodeEditor } from "@/components/CodeEditor";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ResultConsole } from "@/components/ResultConsole";
import { ActionButtons } from "@/components/ActionButtons";
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
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-tech rounded-lg p-2">
                <span className="text-white font-bold">AI</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-tech bg-clip-text text-transparent">
                  Code Playground
                </h1>
                <p className="text-sm text-muted-foreground">
                  Générez, modifiez et exécutez du code avec l'IA
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            <PromptInput 
              onGenerate={handleGenerate} 
              isLoading={isGenerating} 
            />
            
            <LanguageSelector 
              value={language} 
              onValueChange={setLanguage} 
            />
            
            <ActionButtons
              onModify={handleModify}
              onReset={handleReset}
              onOptimize={handleOptimize}
              onSettings={handleSettings}
              hasCode={!!code}
              isLoading={isGenerating || isExecuting}
            />
          </div>

          {/* Right Panel - Code and Results */}
          <div className="space-y-6">
            <CodeEditor
              code={code}
              language={language}
              onCodeChange={setCode}
              isEditable={isEditable}
              onToggleEdit={() => setIsEditable(!isEditable)}
            />
            
            <ResultConsole
              result={executionResult}
              isExecuting={isExecuting}
              onClear={handleClearConsole}
              onExecute={handleExecute}
              language={language}
            />
          </div>
        </div>
      </main>
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