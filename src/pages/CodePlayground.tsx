import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Dépendances à installer :
// npm install react-syntax-highlighter @types/react-syntax-highlighter
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  Send, Bot, User, Wand2, Zap, RotateCcw, Settings, Sparkles,
  Code, Edit3, Copy, Check, Terminal, CheckCircle, XCircle, 
  AlertTriangle, Trash2, Play, GripVertical, Code2, X
} from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

// Enregistrement des langages pour la coloration syntaxique
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('bash', bash);

// --- TYPES ---
interface ExecutionResult {
  stdout?: string;
  stderr?: string;
  exitCode: number;
  executionTime?: number;
  timestamp: Date;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}


// --- UTILS & HOOKS ---

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// use-toast.ts
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;
type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};
const actionTypes = { ADD_TOAST: "ADD_TOAST", UPDATE_TOAST: "UPDATE_TOAST", DISMISS_TOAST: "DISMISS_TOAST", REMOVE_TOAST: "REMOVE_TOAST" } as const;
let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}
type Action = | { type: "ADD_TOAST"; toast: ToasterToast } | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> } | { type: "DISMISS_TOAST"; toastId?: ToasterToast["id"] } | { type: "REMOVE_TOAST"; toastId?: ToasterToast["id"] };
interface State { toasts: ToasterToast[] }
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) return;
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId: toastId });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST": return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case "UPDATE_TOAST": return { ...state, toasts: state.toasts.map((t) => t.id === action.toast.id ? { ...t, ...action.toast } : t) };
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) { addToRemoveQueue(toastId) } else { state.toasts.forEach((toast) => { addToRemoveQueue(toast.id) }) }
      return { ...state, toasts: state.toasts.map((t) => t.id === toastId || toastId === undefined ? { ...t, open: false } : t) };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) return { ...state, toasts: [] };
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) };
  }
};
const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => { listener(memoryState) });
}
function useToast() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, [state]);
  return { ...state, toast: (props: Omit<ToasterToast, "id">) => {
    const id = genId();
    const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
    dispatch({ type: "ADD_TOAST", toast: { ...props, id, open: true, onOpenChange: (open) => { if (!open) dismiss() } } });
    return { id: id, dismiss };
  }, dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }) };
}


// --- UI COMPONENTS ---

// Button
const buttonVariants = cva("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "bg-primary text-primary-foreground hover:bg-primary/90", destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90", outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground", secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80", ghost: "hover:bg-accent hover:text-accent-foreground", link: "text-primary underline-offset-4 hover:underline" }, size: { default: "h-10 px-4 py-2", sm: "h-9 rounded-md px-3", lg: "h-11 rounded-md px-8", icon: "h-10 w-10" } }, defaultVariants: { variant: "default", size: "default" } });
const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

// Card
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />);
Card.displayName = "Card";
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />);
CardHeader.displayName = "CardHeader";
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />);
CardContent.displayName = "CardContent";

// Textarea
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => {
  return <textarea className={cn("flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)} ref={ref} {...props} />;
});
Textarea.displayName = "Textarea";

// Badge
const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", { variants: { variant: { default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80", secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80", destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80", outline: "text-foreground" } }, defaultVariants: { variant: "default" } });
function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// Resizable
const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)} {...props} />
);
const ResizablePanel = ResizablePrimitive.Panel;
const ResizableHandle = ({ withHandle, className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & { withHandle?: boolean }) => (
  <ResizablePrimitive.PanelResizeHandle className={cn("relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90", className)} {...props}>
    {withHandle && <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border"><GripVertical className="h-2.5 w-2.5" /></div>}
  </ResizablePrimitive.PanelResizeHandle>
);

// ScrollArea
const ScrollArea = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.Root>, React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">{children}</ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
const ScrollBar = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>, React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar ref={ref} orientation={orientation} className={cn("flex touch-none select-none transition-colors", orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]", orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]", className)} {...props}>
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));

// Select
const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger ref={ref} className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}>
    {children}
    <SelectPrimitive.Icon asChild><ChevronDown className="h-4 w-4 opacity-50" /></SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
const SelectContent = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Content>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content ref={ref} className={cn("relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className)} position={position} {...props}>
      <SelectPrimitive.Viewport className={cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}>{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item ref={ref} className={cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)} {...props}>
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center"><SelectPrimitive.ItemIndicator><Check className="h-4 w-4" /></SelectPrimitive.ItemIndicator></span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));

// Toast
const ToastProvider = ToastPrimitives.Provider;
const ToastViewport = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Viewport>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>>(({ className, ...props }, ref) => <ToastPrimitives.Viewport ref={ref} className={cn("fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]", className)} {...props} />);
const toastVariants = cva("group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full", { variants: { variant: { default: "border bg-background text-foreground", destructive: "destructive group border-destructive bg-destructive text-destructive-foreground" } }, defaultVariants: { variant: "default" } });
const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Root>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>>(({ className, variant, ...props }, ref) => <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />);
const ToastClose = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Close>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>>(({ className, ...props }, ref) => <ToastPrimitives.Close ref={ref} className={cn("absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600", className)} toast-close="" {...props}><X className="h-4 w-4" /></ToastPrimitives.Close>);
const ToastTitle = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Title>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>>(({ className, ...props }, ref) => <ToastPrimitives.Title ref={ref} className={cn("text-sm font-semibold", className)} {...props} />);
const ToastDescription = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Description>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>>(({ className, ...props }, ref) => <ToastPrimitives.Description ref={ref} className={cn("text-sm opacity-90", className)} {...props} />);
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;
const ToastAction = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Action>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>>(({ className, ...props }, ref) => <ToastPrimitives.Action ref={ref} className={cn("inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive", className)} {...props} />);
function Toaster() {
  const { toasts } = useToast();
  return (<ToastProvider>{toasts.map(function ({ id, title, description, action, ...props }) { return (<Toast key={id} {...props}><div className="grid gap-1">{title && <ToastTitle>{title}</ToastTitle>}{description && <ToastDescription>{description}</ToastDescription>}</div>{action}<ToastClose /></Toast>); }) }<ToastViewport /></ToastProvider>);
}


// --- APPLICATION COMPONENTS ---

// LanguageSelector
const languages = [
  { value: "python", label: "Python", badge: "PY", description: "Idéal pour IA, data science et scripts" },
  { value: "javascript", label: "JavaScript", badge: "JS", description: "Parfait pour le web et Node.js" },
  { value: "bash", label: "Bash/Shell", badge: "SH", description: "Scripts système et automation" },
];
function LanguageSelector({ value, onValueChange }: { value: string; onValueChange: (value: string) => void; }) {
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
            {selectedLanguage && <Badge variant="outline" className="text-xs border-primary/30 text-primary">{selectedLanguage.badge}</Badge>}
            <SelectValue placeholder="Choisir un langage" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {languages.map((lang) => (
            <SelectItem key={lang.value} value={lang.value} className="hover:bg-accent focus:bg-accent">
              <div className="flex items-center gap-3 w-full">
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">{lang.badge}</Badge>
                <div className="flex-1">
                  <div className="font-medium">{lang.label}</div>
                  <div className="text-xs text-muted-foreground">{lang.description}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ResultConsole
function ResultConsole({ result, isExecuting, onClear, onExecute, language }: { result: ExecutionResult | null; isExecuting: boolean; onClear: () => void; onExecute: () => void; language: string; }) {
  const getStatusBadge = () => {
    if (isExecuting) return <Badge variant="secondary" className="animate-pulse-subtle"><div className="animate-glow">En cours...</div></Badge>;
    if (!result) return <Badge variant="outline" className="border-muted-foreground/30">Aucune exécution</Badge>;
    if (result.exitCode === 0) return <Badge variant="default" className="bg-green-600 text-white"><CheckCircle className="h-3 w-3 mr-1" />Succès</Badge>;
    return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Erreur ({result.exitCode})</Badge>;
  };
  const getConsoleContent = () => {
    if (isExecuting) return <div className="animate-fade-in text-muted-foreground"><div className="animate-pulse-subtle">Exécution du code {language} en cours...</div></div>;
    if (!result) return <div className="text-muted-foreground text-center py-8"><Terminal className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>Aucun résultat d'exécution</p><p className="text-sm">Cliquez sur "Exécuter" pour lancer le code</p></div>;
    return (
      <div className="space-y-3">
        {result.stdout && <div><div className="text-xs text-green-400 mb-1 flex items-center gap-1"><CheckCircle className="h-3 w-3" />SORTIE STANDARD</div><pre className="text-sm bg-background/20 border border-green-500/30 rounded p-3 overflow-auto">{result.stdout}</pre></div>}
        {result.stderr && <div><div className="text-xs text-destructive mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />ERREURS</div><pre className="text-sm bg-background/20 border border-destructive/30 rounded p-3 overflow-auto text-destructive">{result.stderr}</pre></div>}
        <div className="flex justify-between text-xs text-muted-foreground border-t border-border/30 pt-3"><span>Temps d'exécution: {result.executionTime ? `${Math.round(result.executionTime)}ms` : 'N/A'}</span><span>{result.timestamp.toLocaleTimeString()}</span></div>
      </div>
    );
  };
  return (
    <Card className="bg-console-bg border-border/50 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3 flex-shrink-0"><div className="flex items-center gap-2"><Terminal className="h-5 w-5 text-primary" /><h3 className="font-semibold">Console</h3>{getStatusBadge()}</div><div className="flex items-center gap-2"><Button onClick={onExecute} disabled={isExecuting} size="sm" className="bg-primary hover:bg-primary/90"><Play className="h-4 w-4 mr-2" />Exécuter</Button>{result && <Button onClick={onClear} variant="ghost" size="sm" className="h-8 w-8 p-0"><Trash2 className="h-4 w-4" /></Button>}</div></CardHeader>
      <CardContent className="pt-0 flex-1 min-h-0"><div className="bg-gradient-console rounded-lg p-4 h-full overflow-auto">{getConsoleContent()}</div></CardContent>
    </Card>
  );
}

// CodeEditor
function CodeEditor({ code, language, onCodeChange, isEditable = false, onToggleEdit }: { code: string; language: string; onCodeChange: (code: string) => void; isEditable?: boolean; onToggleEdit?: () => void; }) {
  const [localCode, setLocalCode] = useState(code);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  useEffect(() => { setLocalCode(code) }, [code]);
  const handleCopy = async () => {
    if (!localCode) return;
    try {
      await navigator.clipboard.writeText(localCode);
      setCopied(true);
      toast({ title: "Code copié !", description: "Le code a été copié dans le presse-papiers" });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ title: "Erreur de copie", description: "Impossible de copier le code", variant: "destructive" });
    }
  };
  return (
    <Card className="bg-code-bg border-border/50 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3 flex-shrink-0"><div className="flex items-center gap-2"><Code className="h-5 w-5 text-primary" /><h3 className="font-semibold">Éditeur de code</h3><Badge variant="outline" className="border-primary/30 text-primary">{language}</Badge></div><div className="flex items-center gap-2"><Button onClick={handleCopy} variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={!localCode}>{copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}</Button>{onToggleEdit && <Button onClick={onToggleEdit} variant="ghost" size="sm" className={`h-8 w-8 p-0 ${isEditable ? 'text-primary' : ''}`}><Edit3 className="h-4 w-4" /></Button>}</div></CardHeader>
      <CardContent className="pt-0 flex-1 min-h-0">
        {isEditable ? <Textarea value={localCode} onChange={(e) => { setLocalCode(e.target.value); onCodeChange(e.target.value); }} className="h-full font-mono text-sm bg-background/5 border-border/30 resize-none" placeholder="Votre code apparaîtra ici..." /> : 
        <div className="bg-background/5 border border-border/30 rounded-lg text-sm overflow-hidden h-full">
          {localCode ? <SyntaxHighlighter language={language} style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', backgroundColor: 'transparent', height: '100%', overflow: 'auto' }} codeTagProps={{ style: { fontFamily: 'monospace', fontSize: '0.875rem' } }}>{localCode}</SyntaxHighlighter> : <div className="flex h-full items-center justify-center text-muted-foreground p-4"><p>Aucun code généré pour le moment...</p></div>}
        </div>}
      </CardContent>
    </Card>
  );
}

// ChatInterface
function ChatInterface({ onGenerate, onModify, onOptimize, onReset, onSettings, hasCode, isLoading = false, messages }: { onGenerate: (prompt: string) => void; onModify: () => void; onOptimize: () => void; onReset: () => void; onSettings: () => void; hasCode: boolean; isLoading?: boolean; messages: Message[] }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isLoading]);
  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onGenerate(input.trim());
      setInput("");
    }
  };
  return (
    <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="flex-shrink-0 pb-3 border-b border-border/30"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="bg-gradient-tech rounded-lg p-1.5"><Sparkles className="h-4 w-4 text-white" /></div><h3 className="font-semibold text-sm">Assistant IA</h3></div><div className="flex items-center gap-1"><Button onClick={onModify} disabled={!hasCode || isLoading} variant="ghost" size="sm" className="h-7 px-2 text-xs hover:bg-primary/10"><Wand2 className="h-3 w-3 mr-1" />Modifier</Button><Button onClick={onOptimize} disabled={!hasCode || isLoading} variant="ghost" size="sm" className="h-7 px-2 text-xs hover:bg-warning/10"><Zap className="h-3 w-3 mr-1" />Optimiser</Button><Button onClick={onReset} disabled={isLoading} variant="ghost" size="sm" className="h-7 px-2 text-xs hover:bg-destructive/10"><RotateCcw className="h-3 w-3 mr-1" />Reset</Button><Button onClick={onSettings} variant="ghost" size="sm" className="h-7 px-2 text-xs hover:bg-accent/10"><Settings className="h-3 w-3" /></Button></div></div></CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden"><ScrollArea className="h-full p-4" ref={scrollRef}><div className="space-y-4">{messages.map((message) => (<div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>{message.type === 'ai' && <div className="bg-primary rounded-full p-1.5 flex-shrink-0 h-8 w-8 flex items-center justify-center"><Bot className="h-4 w-4 text-primary-foreground" /></div>}<div className={`max-w-[80%] rounded-lg p-3 ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}><p className="text-sm whitespace-pre-wrap">{message.content}</p></div>{message.type === 'user' && <div className="bg-secondary rounded-full p-1.5 flex-shrink-0 h-8 w-8 flex items-center justify-center"><User className="h-4 w-4" /></div>}</div>))}{isLoading && <div className="flex gap-3 justify-start"><div className="bg-primary rounded-full p-1.5 flex-shrink-0 h-8 w-8 flex items-center justify-center"><Bot className="h-4 w-4 text-primary-foreground" /></div><div className="bg-muted rounded-lg p-3"><div className="flex items-center gap-2"><div className="animate-pulse-subtle text-sm">Génération en cours...</div><div className="flex gap-1"><div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div><div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div><div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div></div></div></div></div>}</div></ScrollArea></CardContent>
      <div className="flex-shrink-0 p-4 border-t border-border/30"><div className="flex gap-2"><Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSubmit(); } }} placeholder="Tapez votre message... (Ctrl+Entrée)" className="min-h-[44px] max-h-32 resize-none" disabled={isLoading} /><Button onClick={handleSubmit} disabled={!input.trim() || isLoading} size="sm" className="px-3 h-11 bg-primary hover:bg-primary/90"><Send className="h-4 w-4" /></Button></div></div>
    </Card>
  );
}


// --- MAIN PAGE COMPONENT ---

function CodePlayground() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', type: 'ai', content: 'Bonjour ! Décrivez-moi le code que vous souhaitez créer ou modifier.', timestamp: new Date() }
  ]);
  const { toast } = useToast();

  const handleSendMessage = async (prompt: string) => {
    setIsGenerating(true);
    const userMessage: Message = { id: Date.now().toString(), type: 'user', content: prompt, timestamp: new Date() };
    const currentHistory = [...messages, userMessage];
    setMessages(currentHistory);

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: currentHistory.map(m => ({ type: m.type === 'ai' ? 'assistant' : 'user', content: m.content })),
          code_context: code,
          language
        }),
      });
      const data = await response.json();
      if (response.ok) {
        const aiMessage: Message = { id: (Date.now() + 1).toString(), type: 'ai', content: data.chat_message, timestamp: new Date() };
        setMessages(prev => [...prev, aiMessage]);
        if (data.code) {
          setCode(data.code);
          toast({ title: "Code mis à jour !", description: "L'IA a modifié le code dans l'éditeur." });
        }
      } else {
        throw new Error(data.error || "Erreur de l'API");
      }
    } catch (error: any) {
      const errorMessage: Message = { id: (Date.now() + 1).toString(), type: 'ai', content: `Désolé, une erreur est survenue : ${error.message}`, timestamp: new Date() };
      setMessages(prev => [...prev, errorMessage]);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecute = async () => {
    if (!code.trim()) {
      toast({ title: "Erreur", description: "Aucun code à exécuter", variant: "destructive" });
      return;
    }
    setIsExecuting(true);
    setShowConsole(true);
    try {
      const response = await fetch("http://localhost:5000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await response.json();
      if (response.ok) {
        setExecutionResult({ ...data, timestamp: new Date(data.timestamp) });
        toast({ title: "Code exécuté", description: "L'exécution s'est terminée." });
      } else {
        throw new Error(data.error || "Erreur lors de l'exécution du code");
      }
    } catch (error: any) {
      setExecutionResult({ stdout: '', stderr: error.message, exitCode: 1, timestamp: new Date() });
      toast({ title: "Erreur d'exécution", description: error.message, variant: "destructive" });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = () => {
    setCode("");
    setExecutionResult(null);
    setIsEditable(false);
    setShowConsole(false);
    setMessages([{ id: '1', type: 'ai', content: 'Bonjour ! Décrivez-moi le code que vous souhaitez créer ou modifier.', timestamp: new Date() }]);
    toast({ title: "Réinitialisé", description: "L'espace de travail a été vidé." });
  };

  return (
    <div className="h-screen w-screen bg-background text-foreground">
      <ResizablePanelGroup direction="horizontal" className="min-h-screen max-w-full items-stretch">
        <ResizablePanel defaultSize={35} minSize={25}>
          <div className="flex h-full flex-col p-4 gap-4">
            <div className="flex-1 min-h-0">
              <ChatInterface
                onGenerate={handleSendMessage}
                onModify={() => toast({ title: "Bientôt disponible" })}
                onOptimize={() => toast({ title: "Bientôt disponible" })}
                onReset={handleReset}
                onSettings={() => toast({ title: "Bientôt disponible" })}
                hasCode={!!code}
                isLoading={isGenerating}
                messages={messages}
              />
            </div>
            <div className="flex-shrink-0">
              <LanguageSelector value={language} onValueChange={setLanguage} />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65} minSize={40}>
          <div className="flex h-full flex-col">
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={showConsole ? 65 : 100} minSize={30}>
                <div className="h-full p-4">
                  <CodeEditor code={code} language={language} onCodeChange={setCode} isEditable={isEditable} onToggleEdit={() => setIsEditable(!isEditable)} />
                </div>
              </ResizablePanel>
              {showConsole && (
                <>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={35} minSize={20}>
                    <div className="h-full p-4">
                      <ResultConsole result={executionResult} isExecuting={isExecuting} onClear={() => { setExecutionResult(null); setShowConsole(false); }} onExecute={handleExecute} language={language} />
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
            {!showConsole && (
              <div className="flex-shrink-0 p-4 border-t border-border/30">
                <Button onClick={handleExecute} disabled={!code.trim() || isExecuting} className="w-full">
                  {isExecuting ? 'Exécution en cours...' : 'Exécuter le code'}
                </Button>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

// --- ROOT APP COMPONENT ---

const queryClient = new QueryClient();

function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<CodePlayground />} />
        <Route path="*" element={<div>404 - Page non trouvée</div>} />
      </Routes>
    </>
  );
}

export default App;
