// src/pages/events/components/FacebookImportSheet.tsx
import { useState } from "react";
import { useForm } from "@refinedev/react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Facebook,
  Link,
  Calendar,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Copy,
  ExternalLink,
  Info,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface FacebookImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: (eventData: any) => void;
}

interface FacebookEventPreview {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location?: {
    name: string;
    address?: string;
    city?: string;
  };
  ticket_uri?: string;
  is_online: boolean;
  cover?: {
    source: string;
  };
}

// Funkcja do generowania losowej nazwy wydarzenia
const generateRandomEventTitle = () => {
  const danceStyles = [
    "Salsa",
    "Bachata",
    "Tango",
    "Kizomba",
    "Zumba",
    "Flamenco",
    "Hip Hop",
    "Swing",
    "Latin",
    "Samba",
  ];
  const eventTypes = [
    "Noc",
    "Wieczór",
    "Potańcówka",
    "Impreza",
    "Festiwal",
    "Maraton",
    "Party",
    "Jam",
  ];
  const locations = [
    "Klub Havana",
    "Studio Tańca Ritmo",
    "Sala Balowa",
    "Centrum Tańca",
    "Klub Latino",
    "Scena Viva",
    "Pałac Kultury",
    "Ogród Taneczny",
  ];
  const themes = [
    "Gorąca",
    "Latynoska",
    "Karaibska",
    "Namiętna",
    "Energetyczna",
    "Kolorowa",
    "",
    "Klasyczna",
  ];

  // Losowy wybór elementów
  const randomDanceStyle = danceStyles[Math.floor(Math.random() * danceStyles.length)];
  const randomEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const randomLocation = locations[Math.floor(Math.random() * locations.length)];
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];

  // Składanie nazwy z losowych elementów
  const prefix = randomTheme ? `${randomTheme} ` : "";
  return `${prefix}${randomDanceStyle} ${randomEventType} w ${randomLocation}`;
};

export const FacebookImportSheet = ({
  open,
  onOpenChange,
  onImportSuccess,
}: FacebookImportSheetProps) => {
  const { data: identity } = useGetIdentity<any>();
  const [step, setStep] = useState<"input" | "preview" | "importing">("input");
  const [eventUrl, setEventUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [eventPreview, setEventPreview] = useState<FacebookEventPreview | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      event_date: "",
      start_time: "",
      end_time: "",
      location_type: "physical",
      location_name: "",
      address: "",
      city: "",
      event_category: "social",
      dance_style_id: "",
      max_participants: "",
      price_amount: "0",
    },
  });

  const handleFetchEvent = async () => {
    if (!eventUrl) {
      toast.error("Podaj link do wydarzenia");
      return;
    }

    setIsLoading(true);

    try {
      // Symulacja pobierania danych z API
      // W rzeczywistej implementacji tutaj byłoby wywołanie do backendu
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Przykładowe dane wydarzenia z Facebooka (zamokowane)
      const mockEventData: FacebookEventPreview = {
        title: generateRandomEventTitle(),
        description: `🎉 Zapraszamy na gorącą noc pełną tańca! 🎉

Dołącz do nas na niezapomnianą potańcówkę w rytmach latynoskich!

W programie:
✨ 20:00-21:00 - Warsztaty dla początkujących
✨ 21:00-02:00 - Potańcówka z DJ-em
✨ Pokazy taneczne
✨ Konkursy z nagrodami

Wstęp: 30 PLN (z warsztatami 40 PLN)

Nie zapomnij wygodnych butów do tańca!`,
        start_time: "2025-08-15T20:00:00",
        end_time: "2025-08-16T02:00:00",
        location: {
          name: "Klub Havana",
          address: "ul. Marszałkowska 55",
          city: "Warszawa",
        },
        is_online: false,
        cover: {
          source: "https://example.com/cover.jpg",
        },
      };

      setEventPreview(mockEventData);

      // Wypełnij formularz danymi z Facebooka
      const startDate = new Date(mockEventData.start_time);
      const endDate = new Date(mockEventData.end_time);

      setValue("title", mockEventData.title);
      setValue("description", mockEventData.description);
      setValue("event_date", format(startDate, "yyyy-MM-dd"));
      setValue("start_time", format(startDate, "HH:mm"));
      setValue("end_time", format(endDate, "HH:mm"));
      setValue("location_type", mockEventData.is_online ? "online" : "physical");
      setValue("location_name", mockEventData.location?.name || "");
      setValue("address", mockEventData.location?.address || "");
      setValue("city", mockEventData.location?.city || "");

      setStep("preview");
      toast.success("Dane wydarzenia pobrane pomyślnie!");
    } catch (error) {
      console.error("Error fetching Facebook event:", error);
      toast.error("Nie udało się pobrać danych wydarzenia", {
        description: "Sprawdź czy link jest poprawny i spróbuj ponownie",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (data: any) => {
    setStep("importing");

    try {
      // Symulacja importu
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Wydarzenie zaimportowane!", {
        description: "Możesz teraz dokończyć konfigurację wydarzenia",
      });

      if (onImportSuccess) {
        onImportSuccess(data);
      }

      // Reset stanu
      setStep("input");
      setEventUrl("");
      setEventPreview(null);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Błąd podczas importu");
      setStep("preview");
    }
  };

  const resetToInput = () => {
    setStep("input");
    setEventPreview(null);
    reset();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Facebook className="w-5 h-5 text-blue-600" />
            Import wydarzenia z Facebooka
          </SheetTitle>
          <SheetDescription>
            {step === "input" && "Wklej link do wydarzenia na Facebooku"}
            {step === "preview" && "Sprawdź i edytuj dane przed importem"}
            {step === "importing" && "Importowanie wydarzenia..."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {step === "input" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="facebook-url">Link do wydarzenia</Label>
                <div className="flex gap-2">
                  <Input
                    id="facebook-url"
                    placeholder="https://www.facebook.com/events/..."
                    value={eventUrl}
                    onChange={(e) => setEventUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.readText().then((text) => {
                        setEventUrl(text);
                        toast.success("Wklejono ze schowka");
                      });
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upewnij się, że wydarzenie jest publiczne
                </p>
              </div>

              {/* Ograniczenia API Facebooka */}
              <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-orange-900">
                      Ważne ograniczenia Facebook API
                    </p>
                    <ul className="space-y-2 text-orange-800">
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600">•</span>
                        <span>Możesz importować tylko wydarzenia <strong>publiczne</strong> ze stron, którymi zarządzasz</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600">•</span>
                        <span>Wydarzenia z grup Facebook <strong>nie są dostępne</strong> przez API</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600">•</span>
                        <span>Wydarzenia prywatne lub z ograniczonym dostępem <strong>nie mogą być importowane</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600">•</span>
                        <span>Facebook ograniczył dostęp do API wydarzeń ze względów bezpieczeństwa</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Instrukcje */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-blue-900">
                      Jak znaleźć link do wydarzenia?
                    </p>
                    <ol className="space-y-1 text-blue-800">
                      <li>1. Otwórz wydarzenie na Facebooku</li>
                      <li>2. Kliknij przycisk "Udostępnij"</li>
                      <li>3. Wybierz "Kopiuj link"</li>
                      <li>4. Wklej link tutaj</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Alternatywa */}
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-900">
                      Alternatywne rozwiązanie
                    </p>
                    <p className="text-gray-700">
                      Jeśli nie możesz zaimportować wydarzenia automatycznie, możesz skopiować dane ręcznie z Facebooka i utworzyć wydarzenie używając standardowego formularza.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleFetchEvent}
                disabled={!eventUrl || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Pobieranie danych...
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4 mr-2" />
                    Pobierz dane wydarzenia
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "preview" && eventPreview && (
            <form onSubmit={handleSubmit(handleImport)}>
              <ScrollArea className="h-[calc(100vh-240px)] pr-4">
                <div className="space-y-6">
                  {/* Podgląd z Facebooka */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Facebook className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Dane z Facebooka</span>
                      <Badge variant="outline" className="ml-auto">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Pobrano
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {format(new Date(eventPreview.start_time), "d MMMM yyyy, HH:mm", {
                            locale: pl,
                          })}
                        </span>
                      </div>
                      {eventPreview.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{eventPreview.location.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Formularz edycji */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Nazwa wydarzenia</Label>
                      <Input
                        id="title"
                        className="mt-1"
                        {...register("title", { required: "Nazwa jest wymagana" })}
                      />
                      {errors.title && (
                        <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">Opis</Label>
                      <Textarea
                        id="description"
                        rows={4}
                        className="mt-1"
                        {...register("description")}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="event_date">Data</Label>
                        <Input
                          id="event_date"
                          type="date"
                          className="mt-1"
                          {...register("event_date", { required: true })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="start_time">Od</Label>
                          <Input
                            id="start_time"
                            type="time"
                            className="mt-1"
                            {...register("start_time", { required: true })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end_time">Do</Label>
                          <Input
                            id="end_time"
                            type="time"
                            className="mt-1"
                            {...register("end_time", { required: true })}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="location_name">Miejsce</Label>
                      <Input
                        id="location_name"
                        className="mt-1"
                        {...register("location_name")}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">Miasto</Label>
                        <Input id="city" className="mt-1" {...register("city")} />
                      </div>
                      <div>
                        <Label htmlFor="price_amount">Cena (PLN)</Label>
                        <Input
                          id="price_amount"
                          type="number"
                          min="0"
                          className="mt-1"
                          {...register("price_amount")}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <SheetFooter className="mt-6 gap-2">
                <Button type="button" variant="outline" onClick={resetToInput}>
                  Wróć
                </Button>
                <Button type="submit">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Importuj wydarzenie
                </Button>
              </SheetFooter>
            </form>
          )}

          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Importowanie wydarzenia...</p>
              <p className="text-sm text-muted-foreground">To może potrwać chwilę</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};