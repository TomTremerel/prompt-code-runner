import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Code2 } from "lucide-react";

interface Language {
  value: string;
  label: string;
  badge: string;
  description: string;
}

const languages: Language[] = [
  {
    value: "python",
    label: "Python",
    badge: "PY",
    description: "Idéal pour IA, data science et scripts"
  },
  {
    value: "javascript",
    label: "JavaScript",
    badge: "JS",
    description: "Parfait pour le web et Node.js"
  },
  {
    value: "typescript",
    label: "TypeScript",
    badge: "TS",
    description: "JavaScript typé pour de gros projets"
  },
  {
    value: "bash",
    label: "Bash/Shell",
    badge: "SH",
    description: "Scripts système et automation"
  },
  {
    value: "go",
    label: "Go",
    badge: "GO",
    description: "Performances et concurrence"
  },
  {
    value: "rust",
    label: "Rust",
    badge: "RS",
    description: "Sécurité mémoire et performances"
  }
];

interface LanguageSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function LanguageSelector({ value, onValueChange }: LanguageSelectorProps) {
  const selectedLanguage = languages.find(lang => lang.value === value);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Code2 className="h-4 w-4" />
        <span>Langage de programmation</span>
      </div>
      
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full bg-secondary/50 border-border/50">
          <div className="flex items-center gap-2">
            {selectedLanguage && (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                {selectedLanguage.badge}
              </Badge>
            )}
            <SelectValue placeholder="Choisir un langage" />
          </div>
        </SelectTrigger>
        
        <SelectContent className="bg-popover border-border">
          {languages.map((lang) => (
            <SelectItem 
              key={lang.value} 
              value={lang.value}
              className="hover:bg-accent focus:bg-accent"
            >
              <div className="flex items-center gap-3 w-full">
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  {lang.badge}
                </Badge>
                <div className="flex-1">
                  <div className="font-medium">{lang.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {lang.description}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}