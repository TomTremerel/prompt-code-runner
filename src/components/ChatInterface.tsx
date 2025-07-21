import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Bot, 
  User, 
  Wand2, 
  Zap, 
  RotateCcw, 
  Settings,
  Sparkles 
} from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onGenerate: (prompt: string) => void;
  onModify: () => void;
  onOptimize: () => void;
  onReset: () => void;
  onSettings: () => void;
  hasCode: boolean;
  isLoading?: boolean;
}

export function ChatInterface({ 
  onGenerate,
  onModify,
  onOptimize, 
  onReset,
  onSettings,
  hasCode,
  isLoading = false 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Bonjour ! Je suis votre assistant IA pour la génération de code. Décrivez-moi ce que vous souhaitez créer et je génèrerai le code correspondant.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: input.trim(),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      onGenerate(input.trim());
      setInput("");
      
      // Ajouter un message "en cours de génération"
      const loadingMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Génération du code en cours...',
        timestamp: new Date()
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, loadingMessage]);
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Mettre à jour le dernier message IA quand la génération est terminée
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === 'ai' && lastMessage.content.includes('en cours')) {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...lastMessage,
            content: 'Code généré avec succès ! Vous pouvez maintenant l\'exécuter ou me demander des modifications.'
          };
          return newMessages;
        });
      }
    }
  }, [isLoading, messages]);

  return (
    <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-border/50">
      {/* Header avec boutons d'action */}
      <CardHeader className="flex-shrink-0 pb-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-tech rounded-lg p-1.5">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-sm">Assistant IA</h3>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              onClick={onModify}
              disabled={!hasCode || isLoading}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs hover:bg-primary/10"
            >
              <Wand2 className="h-3 w-3 mr-1" />
              Modifier
            </Button>
            
            <Button
              onClick={onOptimize}
              disabled={!hasCode || isLoading}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs hover:bg-warning/10"
            >
              <Zap className="h-3 w-3 mr-1" />
              Optimiser
            </Button>
            
            <Button
              onClick={onReset}
              disabled={isLoading}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs hover:bg-destructive/10"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
            
            <Button
              onClick={onSettings}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs hover:bg-accent/10"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Zone de messages */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'ai' && (
                  <div className="bg-primary rounded-full p-1.5 flex-shrink-0 h-8 w-8 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                {message.type === 'user' && (
                  <div className="bg-secondary rounded-full p-1.5 flex-shrink-0 h-8 w-8 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="bg-primary rounded-full p-1.5 flex-shrink-0 h-8 w-8 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse-subtle text-sm">
                      Génération en cours...
                    </div>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Zone de saisie */}
      <div className="flex-shrink-0 p-4 border-t border-border/30">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tapez votre message... (Ctrl+Entrée pour envoyer)"
            className="min-h-[44px] max-h-32 resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="px-3 h-11 bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}