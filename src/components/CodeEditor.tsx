import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Code, Edit3, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeEditorProps {
  code: string;
  language: string;
  onCodeChange: (code: string) => void;
  isEditable?: boolean;
  onToggleEdit?: () => void;
}

export function CodeEditor({ 
  code, 
  language, 
  onCodeChange, 
  isEditable = false,
  onToggleEdit 
}: CodeEditorProps) {
  const [localCode, setLocalCode] = useState(code);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLocalCode(code);
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localCode);
      setCopied(true);
      toast({
        title: "Code copié !",
        description: "Le code a été copié dans le presse-papiers",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erreur de copie",
        description: "Impossible de copier le code",
        variant: "destructive"
      });
    }
  };

  const handleChange = (value: string) => {
    setLocalCode(value);
    if (isEditable) {
      onCodeChange(value);
    }
  };

  return (
    <Card className="bg-code-bg border-border/50 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Code généré</h3>
          <Badge variant="outline" className="border-primary/30 text-primary">
            {language}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCopy}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={!localCode}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          
          {onToggleEdit && (
            <Button
              onClick={onToggleEdit}
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${isEditable ? 'text-primary' : ''}`}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 min-h-0">
        {isEditable ? (
          <Textarea
            value={localCode}
            onChange={(e) => handleChange(e.target.value)}
            className="h-full font-mono text-sm bg-background/5 border-border/30 resize-none"
            placeholder="Votre code apparaîtra ici..."
          />
        ) : (
          <div className="bg-background/5 border border-border/30 rounded-lg text-sm overflow-hidden h-full">
            {localCode ? (
                <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{ 
                        margin: 0, 
                        padding: '1rem', 
                        backgroundColor: 'transparent',
                        height: '100%',
                        overflow: 'auto'
                    }}
                    codeTagProps={{
                        style: {
                            fontFamily: 'monospace',
                            fontSize: '0.875rem'
                        }
                    }}
                >
                    {localCode}
                </SyntaxHighlighter>
            ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground p-4">
                    <p>Aucun code généré pour le moment...</p>
                </div>
            )}
        </div>
        )}
      </CardContent>
    </Card>
  );
} 