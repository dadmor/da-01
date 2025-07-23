// src/pages/events/components/AIAssistantSheet.tsx
import { useState, useEffect } from "react";
import { useGetIdentity } from "@refinedev/core";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Info,
  Wand2,
  Calendar,
  Clock,
  Music,
  Users,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { pl } from "date-fns/locale";
import { useFormSchemaStore, useLLMOperation } from "@/utility";
import { Card } from "@/components/ui/card";

interface AIAssistantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateSuccess?: (eventData: any) => void;
}

interface EventPreview {
  title: string;
  description: string;
  event_category: string;
  dance_style?: string;
  event_date: string;
  start_time: string;
  end_time: string;
  skill_level_required?: string;
  max_participants?: string;
  price_amount?: string;
  requires_partner?: boolean;
}

const EXAMPLE_PROMPTS = [
  {
    title: "Warsztaty salsy",
    prompt:
      "Zorganizuj warsztaty salsy kubańskiej dla średniozaawansowanych, w sobotnie popołudnie, 2 godziny, maksymalnie 20 osób, cena 60 zł",
  },
  {
    title: "Potańcówka taneczna",
    prompt:
      "Stwórz wydarzenie - potańcówka z muzyką latynoską, piątkowy wieczór od 20:00 do 1:00, dla wszystkich poziomów, wstęp 30 zł",
  },
  {
    title: "Lekcja tanga",
    prompt:
      "Lekcja tanga argentyńskiego dla początkujących, środa 19:00, 90 minut, wymagany partner, maksymalnie 8 par, 40 zł od osoby",
  },
  {
    title: "Turniej taneczny",
    prompt:
      "Zawody taneczne w stylach standardowych, niedziela od 10:00, dla zaawansowanych i profesjonalnych, wpisowe 100 zł",
  },
];

// Funkcja do ponownego próbowania żądania
const retryOperation = async (
  execute: () => Promise<any>,
  maxRetries = 3,
  delay = 1000
): Promise<any> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await execute();
    } catch (error: any) {
      if (error.message.includes("500") && attempt < maxRetries) {
        console.warn(`Retry ${attempt}/${maxRetries} after 500 error`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

export const AIAssistantSheet = ({
  open,
  onOpenChange,
  onGenerateSuccess,
}: AIAssistantSheetProps) => {
  const { data: identity } = useGetIdentity<any>();
  const [step, setStep] = useState<"input" | "preview">("input");
  const [prompt, setPrompt] = useState("");
  const [eventPreview, setEventPreview] = useState<EventPreview | null>(null);

  const {
    register: registerSchema,
    setData,
    getData,
    registerLLMOperation,
  } = useFormSchemaStore();

  const {
    loading: isGenerating,
    error: llmError,
    executeOperation,
    clearOperation,
  } = useLLMOperation("event-assistant", "generate-event");

  useEffect(() => {
    registerSchema({
      id: "event-assistant",
      title: "Asystent tworzenia wydarzeń",
      schema: {
        title: "Generowanie wydarzenia",
        properties: {
          prompt: {
            type: "text",
            title: "Opis wydarzenia",
          },
        },
        required: ["prompt"],
      },
    });

    // Poprawiona konfiguracja LLM dla AIAssistantSheet

    registerLLMOperation("event-assistant", {
      id: "generate-event",
      name: "Generuj dane wydarzenia",
      config: {
        endpoint: "https://diesel-power-backend.onrender.com/api/chat",
      },
      prompt: {
        system:
          "Jesteś asystentem tworzenia wydarzeń tanecznych. Generujesz dane wydarzeń w formacie JSON.",
        user: `
  Stwórz wydarzenie taneczne na podstawie opisu: {{prompt}}
  
  Wygeneruj JSON:
  {
    "title": "<krótka nazwa wydarzenia>",
    "description": "<szczegółowy opis wydarzenia 50-150 słów>",
    "event_category": "<jedna z: lesson, workshop, social, competition, performance>",
    "dance_style": "<styl tańca lub null jeśli nie określono>",
    "event_date": "<data w formacie YYYY-MM-DD>",
    "start_time": "<godzina rozpoczęcia HH:MM>",
    "end_time": "<godzina zakończenia HH:MM>",
    "skill_level_required": "<jedna z: beginner, intermediate, advanced, professional lub null>",
    "max_participants": "<maksymalna liczba uczestników lub null>",
    "price_amount": "<cena w PLN jako string lub '0' jeśli darmowe>",
    "requires_partner": <true jeśli wymagany partner, false w przeciwnym razie>
  }
  
  Wymagania:
  - Zwróć TYLKO obiekt JSON, bez dodatkowego tekstu
  - Użyj najbliższej soboty jako daty jeśli nie określono
  - Domyślny czas trwania to 2 godziny
  - Wszystkie wartości muszą być poprawne
  `,
        responseFormat: "json",
      },
      inputMapping: (data) => ({
        prompt: data.prompt,
      }),
      outputMapping: (llmResult, currentData) => ({
        ...currentData,
        ...llmResult,
      }),
      validation: (result) => {
        return (
          result &&
          typeof result === "object" &&
          result.title &&
          result.event_category &&
          result.event_date &&
          result.start_time &&
          result.end_time
        );
      },
    });
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Opisz wydarzenie, które chcesz stworzyć");
      return;
    }

    try {
      clearOperation();
      setData("event-assistant", { prompt });

      const result = await retryOperation(() => executeOperation({ prompt }));
      console.log("Raw LLM result:", result);

      setEventPreview(result);
      setStep("preview");

      toast.success("Wydarzenie wygenerowane!", {
        description: "Sprawdź dane przed importem",
      });
    } catch (error: any) {
      console.error("Generation error:", {
        message: error.message,
        stack: error.stack,
        prompt,
      });
    }
  };

  const handleImport = () => {
    if (!eventPreview) return;

    if (onGenerateSuccess) {
      onGenerateSuccess({
        ...eventPreview,
        location_type: "physical",
      });
    }

    setStep("input");
    setPrompt("");
    setEventPreview(null);
    clearOperation();
    onOpenChange(false);

    toast.success("Dane zostały zaimportowane!", {
      description: "Uzupełnij lokalizację i pozostałe szczegóły",
    });
  };

  const handleExampleClick = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  const resetToInput = () => {
    setStep("input");
    setEventPreview(null);
    clearOperation();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-600" />
            Asystent AI
          </SheetTitle>
          <SheetDescription>
            {step === "input" && "Opisz wydarzenie, a AI wygeneruje szczegóły"}
            {step === "preview" && "Sprawdź wygenerowane dane"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {step === "input" && (
            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="space-y-6 pr-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Opisz swoje wydarzenie</Label>
                  <Textarea
                    id="prompt"
                    placeholder="np. Warsztaty bachaty dla początkujących w sobotę wieczorem, 2 godziny, maksymalnie 15 osób..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Opisz typ wydarzenia, poziom uczestników, termin, długość
                    trwania i inne ważne szczegóły
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Przykładowe opisy:</p>
                  <div className="grid gap-2">
                    {EXAMPLE_PROMPTS.map((example, index) => (
                      <Card
                        key={index}
                        className="p-3 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleExampleClick(example.prompt)}
                      >
                        <p className="text-sm font-medium mb-1">
                          {example.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {example.prompt}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-purple-900">
                        Co może wygenerować AI?
                      </p>
                      <ul className="space-y-1 text-purple-800">
                        <li className="flex items-start gap-2">
                          <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>Tytuł i opis wydarzenia</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Calendar className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>Sugerowaną datę i godziny</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Music className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>Typ wydarzenia i styl tańca</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Users className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>Poziom trudności i limit miejsc</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <DollarSign className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>Sugerowaną cenę</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-orange-900 mb-1">
                        Lokalizację dodasz później
                      </p>
                      <p className="text-orange-800">
                        AI nie generuje adresów - będziesz mógł je uzupełnić w
                        kolejnym kroku
                      </p>
                    </div>
                  </div>
                </div>

                {llmError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-red-900">
                          Błąd generowania
                        </p>
                        <p className="text-red-800">{llmError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generowanie...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Wygeneruj wydarzenie
                    </>
                  )}
                </Button>
              </div>
            </ScrollArea>
          )}

          {step === "preview" && eventPreview && (
            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="space-y-6 pr-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      Wydarzenie wygenerowane pomyślnie
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Nazwa
                    </Label>
                    <p className="font-semibold text-lg">
                      {eventPreview.title}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Opis
                    </Label>
                    <p className="text-sm whitespace-pre-wrap">
                      {eventPreview.description}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Typ
                      </Label>
                      <Badge variant="secondary" className="mt-1">
                        {eventPreview.event_category === "lesson" && "Lekcja"}
                        {eventPreview.event_category === "workshop" &&
                          "Warsztaty"}
                        {eventPreview.event_category === "social" &&
                          "Potańcówka"}
                        {eventPreview.event_category === "competition" &&
                          "Zawody"}
                        {eventPreview.event_category === "performance" &&
                          "Występ"}
                      </Badge>
                    </div>

                    {eventPreview.dance_style && (
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Styl tańca
                        </Label>
                        <p className="text-sm font-medium">
                          {eventPreview.dance_style}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Termin
                    </Label>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {format(
                          new Date(eventPreview.event_date),
                          "EEEE, d MMMM yyyy",
                          {
                            locale: pl,
                          }
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {eventPreview.start_time} - {eventPreview.end_time}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    {eventPreview.skill_level_required && (
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Poziom
                        </Label>
                        <p className="text-sm font-medium">
                          {eventPreview.skill_level_required === "beginner" &&
                            "Początkujący"}
                          {eventPreview.skill_level_required ===
                            "intermediate" && "Średniozaawansowany"}
                          {eventPreview.skill_level_required === "advanced" &&
                            "Zaawansowany"}
                          {eventPreview.skill_level_required ===
                            "professional" && "Profesjonalny"}
                        </p>
                      </div>
                    )}

                    {eventPreview.max_participants && (
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Limit miejsc
                        </Label>
                        <p className="text-sm font-medium">
                          <Users className="w-3 h-3 inline mr-1" />
                          {eventPreview.max_participants} osób
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Cena
                      </Label>
                      <p className="text-sm font-medium">
                        {eventPreview.price_amount === "0" ? (
                          <Badge variant="outline" className="text-green-600">
                            Bezpłatne
                          </Badge>
                        ) : (
                          <>
                            <DollarSign className="w-3 h-3 inline mr-1" />
                            {eventPreview.price_amount} PLN
                          </>
                        )}
                      </p>
                    </div>

                    {eventPreview.requires_partner && (
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Wymagania
                        </Label>
                        <Badge variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          Wymagany partner
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">
                        Pamiętaj o uzupełnieniu lokalizacji
                      </p>
                      <p className="text-blue-800">
                        Po imporcie dodaj adres miejsca, w którym odbędzie się
                        wydarzenie
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>

        <SheetFooter className="mt-6">
          {step === "input" ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={resetToInput}>
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Wróć
              </Button>
              <Button variant="outline" onClick={handleGenerate}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Generuj ponownie
              </Button>
              <Button onClick={handleImport} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Importuj dane
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
