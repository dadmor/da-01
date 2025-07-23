// src/pages/events/create.tsx
import { useState, useEffect } from "react";
import { useForm } from "@refinedev/react-hook-form";
import { useNavigation, useGetIdentity } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  X,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  Music,
  Sparkles,
  Star,
  Heart,
  Trophy,
  TrendingUp,
  Info,
  CheckCircle,
  Facebook,
  Bot,
} from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabaseClient } from "@/utility";
import { cn } from "@/utility";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";
import { FacebookImportSheet } from "./components/FacebookImportSheet";
import { AIAssistantSheet } from "./components/AIAssistantSheet";

interface UserIdentity {
  id: string;
}

interface DanceStyle {
  id: string;
  name: string;
  category: string;
}

interface EventFormData {
  title: string;
  event_category: string;
  dance_style_id?: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location_type: string;
  online_platform?: string;
  online_link?: string;
  location_name?: string;
  address?: string;
  city?: string;
  max_participants?: string;
  skill_level_required?: string;
  requires_partner: boolean;
  price_amount?: string;
  visibility: string;
  status: string;
}

export const EventsCreate = () => {
  const { list } = useNavigation();
  const { data: identity } = useGetIdentity<UserIdentity>();
  const [danceStyles, setDanceStyles] = useState<DanceStyle[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [showFacebookImport, setShowFacebookImport] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    defaultValues: {
      event_category: "lesson",
      location_type: "physical",
      visibility: "public",
      status: "published",
      requires_partner: false,
    },
  });

  const eventCategory = watch("event_category");
  const locationType = watch("location_type");
  const priceAmount = watch("price_amount");

  useEffect(() => {
    const fetchDanceStyles = async () => {
      const { data, error } = await supabaseClient
        .from("dance_styles")
        .select("id, name, category")
        .order("name");
      if (data) {
        setDanceStyles(data);
      }
    };
    fetchDanceStyles();
  }, []);

  const eventCategories = [
    {
      value: "lesson",
      label: "Lekcja",
      icon: <Music className="w-4 h-4" />,
      description: "Indywidualne lub grupowe zajęcia",
    },
    {
      value: "workshop",
      label: "Warsztaty",
      icon: <Star className="w-4 h-4" />,
      description: "Intensywne szkolenie tematyczne",
    },
    {
      value: "social",
      label: "Potańcówka",
      icon: <Sparkles className="w-4 h-4" />,
      description: "Impreza taneczna",
    },
    {
      value: "competition",
      label: "Zawody",
      icon: <Trophy className="w-4 h-4" />,
      description: "Turniej taneczny",
    },
    {
      value: "performance",
      label: "Występ",
      icon: <TrendingUp className="w-4 h-4" />,
      description: "Pokaz taneczny",
    },
  ];

  const handleFacebookImport = (importedData: any) => {
    // Wypełnij formularz danymi z Facebooka
    Object.keys(importedData).forEach((key) => {
      if (importedData[key]) {
        setValue(key as keyof EventFormData, importedData[key]);
      }
    });
    
    // Przejdź do pierwszego kroku
    setCurrentStep(1);
    
    toast.success("Dane zostały zaimportowane", {
      description: "Możesz teraz dokończyć tworzenie wydarzenia",
    });
  };

  const handleAIAssistant = (generatedData: any) => {
    // Wypełnij formularz danymi z AI
    Object.keys(generatedData).forEach((key) => {
      if (generatedData[key] !== undefined && generatedData[key] !== null) {
        setValue(key as keyof EventFormData, generatedData[key]);
      }
    });
    
    // Przejdź do pierwszego kroku
    setCurrentStep(1);
    
    toast.success("Dane zostały wygenerowane", {
      description: "Uzupełnij lokalizację i dokończ tworzenie wydarzenia",
    });
  };

  const handleFormSubmit = async (data: any) => {
    if (!identity?.id) {
      toast.error("Błąd", {
        description: "Musisz być zalogowany, aby utworzyć wydarzenie",
      });
      return;
    }

    try {
      const eventData = {
        organizer_id: identity.id,
        title: data.title,
        description: data.description,
        event_type: data.event_category,
        dance_style_id: data.dance_style_id || null,
        start_at: new Date(
          `${data.event_date}T${data.start_time}`
        ).toISOString(),
        end_at: new Date(
          `${data.event_date}T${data.end_time}`
        ).toISOString(),
        is_recurring: false,
        location_type: data.location_type,
        location_name: data.location_name || null,
        address: data.address || null,
        city: data.city || null,
        online_platform: data.online_platform || null,
        online_link: data.online_link || null,
        price: data.price_amount ? parseFloat(data.price_amount) : 0,
        currency: "PLN",
        max_participants: data.max_participants
          ? parseInt(data.max_participants)
          : null,
        min_participants: 1,
        // participant_count: 0, // USUNIĘTE - tej kolumny już nie ma!
        skill_level_min: data.skill_level_required || null,
        skill_level_max: data.skill_level_required || null,
        requires_partner: data.requires_partner,
        visibility: data.visibility,
        status: data.status,
      };

      const { data: insertedEvent, error } = await supabaseClient
        .from("events")
        .insert(eventData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Sukces!", {
        description: "Wydarzenie zostało utworzone",
      });

      list("events");
    } catch (error) {
      console.error("Błąd podczas tworzenia wydarzenia:", error);
      toast.error("Błąd", {
        description: "Nie udało się utworzyć wydarzenia",
      });
    }
  };

  const steps = [
    { number: 1, title: "Podstawy", icon: <Info className="w-4 h-4" /> },
    { number: 2, title: "Termin", icon: <Calendar className="w-4 h-4" /> },
    { number: 3, title: "Miejsce", icon: <MapPin className="w-4 h-4" /> },
    { number: 4, title: "Szczegóły", icon: <Users className="w-4 h-4" /> },
  ];

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          watch("title") && watch("event_category") && watch("description")
        );
      case 2:
        return watch("event_date") && watch("start_time") && watch("end_time");
      case 3:
        return locationType === "online"
          ? watch("online_platform")
          : watch("address") && watch("city");
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-3xl mx-auto px-4  flex items-center justify-between h-16">
          <Button variant="ghost" size="sm" onClick={() => list("events")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anuluj
          </Button>
          <h1 className="font-semibold text-xl">Nowe wydarzenie</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIAssistant(true)}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              title="Asystent AI"
            >
              <Bot className="w-4 h-4 mr-2" />
              Asystent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFacebookImport(true)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              title="Importuj z Facebooka"
            >
              <Facebook className="w-4 h-4 mr-2" />
              Import
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <button
                  type="button"
                  onClick={() =>
                    currentStep > step.number && setCurrentStep(step.number)
                  }
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                    currentStep === step.number &&
                      "bg-purple-100 text-purple-700",
                    currentStep > step.number &&
                      "text-green-600 cursor-pointer hover:bg-gray-100",
                    currentStep < step.number && "text-gray-400"
                  )}
                  disabled={currentStep < step.number}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                      currentStep === step.number && "bg-purple-600 text-white",
                      currentStep > step.number && "bg-green-600 text-white",
                      currentStep < step.number && "bg-gray-200"
                    )}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className="hidden sm:inline font-medium">
                    {step.title}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-12 h-0.5 mx-2",
                      currentStep > step.number ? "bg-green-600" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="max-w-3xl mx-auto px-4 py-6"
      >
        {/* Step 1: Podstawy */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>O czym jest Twoje wydarzenie?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Event Category */}
                <div>
                  <Label className="text-base font-medium mb-3 block">
                    Wybierz typ wydarzenia
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {eventCategories.map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() =>
                          setValue("event_category", category.value)
                        }
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all text-left",
                          eventCategory === category.value
                            ? "border-purple-600 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={cn(
                              "p-1.5 rounded",
                              eventCategory === category.value
                                ? "bg-purple-600 text-white"
                                : "bg-gray-100"
                            )}
                          >
                            {category.icon}
                          </div>
                          <span className="font-medium">{category.label}</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {category.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title">
                    Nazwa wydarzenia <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="np. Salsa kubańska dla początkujących"
                    className="mt-1"
                    {...register("title", {
                      required: "Nazwa jest wymagana",
                      minLength: {
                        value: 5,
                        message: "Nazwa musi mieć minimum 5 znaków",
                      },
                    })}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">
                      {String(errors.title.message)}
                    </p>
                  )}
                </div>

                {/* Dance Style */}
                <div>
                  <Label htmlFor="dance_style_id">Styl tańca</Label>
                  <Select
                    value={watch("dance_style_id")}
                    onValueChange={(value) => setValue("dance_style_id", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Wybierz styl tańca" />
                    </SelectTrigger>
                    <SelectContent>
                      {danceStyles.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">
                    Opis wydarzenia <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Opisz co będzie się działo, dla kogo jest wydarzenie, czego nauczysz..."
                    rows={4}
                    className="mt-1"
                    {...register("description", {
                      required: "Opis jest wymagany",
                      minLength: {
                        value: 20,
                        message: "Opis musi mieć minimum 20 znaków",
                      },
                    })}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">
                      {String(errors.description.message)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Termin */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kiedy się odbędzie?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="event_date">
                    Data <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="event_date"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    className="mt-1"
                    {...register("event_date", {
                      required: "Data jest wymagana",
                    })}
                  />
                  {errors.event_date && (
                    <p className="text-sm text-red-500 mt-1">
                      {String(errors.event_date.message)}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">
                      Godzina rozpoczęcia{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="start_time"
                      type="time"
                      className="mt-1"
                      {...register("start_time", {
                        required: "Godzina rozpoczęcia jest wymagana",
                      })}
                    />
                    {errors.start_time && (
                      <p className="text-sm text-red-500 mt-1">
                        {String(errors.start_time.message)}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="end_time">
                      Godzina zakończenia{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="end_time"
                      type="time"
                      className="mt-1"
                      {...register("end_time", {
                        required: "Godzina zakończenia jest wymagana",
                      })}
                    />
                    {errors.end_time && (
                      <p className="text-sm text-red-500 mt-1">
                        {String(errors.end_time.message)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick time suggestions */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Popularne godziny:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["18:00", "19:00", "20:00", "10:00", "11:00"].map(
                      (time) => (
                        <Button
                          key={time}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setValue("start_time", time)}
                        >
                          {time}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Miejsce */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gdzie się odbędzie?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Typ lokalizacji</Label>
                  <RadioGroup
                    value={locationType}
                    onValueChange={(value) => setValue("location_type", value)}
                    className="mt-2 space-y-2"
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="physical" id="physical" />
                      <Label
                        htmlFor="physical"
                        className="flex-1 cursor-pointer"
                      >
                        <span className="font-medium">Stacjonarne</span>
                        <p className="text-sm text-gray-600">
                          Studio, sala, klub
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="online" id="online" />
                      <Label htmlFor="online" className="flex-1 cursor-pointer">
                        <span className="font-medium">Online</span>
                        <p className="text-sm text-gray-600">
                          Zoom, Google Meet, itp.
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem
                        value="hybrid"
                        id="hybrid"
                      />
                      <Label
                        htmlFor="hybrid"
                        className="flex-1 cursor-pointer"
                      >
                        <span className="font-medium">Hybrydowe</span>
                        <p className="text-sm text-gray-600">
                          Stacjonarnie i online
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {locationType === "online" ? (
                  <div>
                    <Label htmlFor="online_platform">
                      Platforma <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch("online_platform")}
                      onValueChange={(value) =>
                        setValue("online_platform", value)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Wybierz platformę" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="google_meet">Google Meet</SelectItem>
                        <SelectItem value="skype">Skype</SelectItem>
                        <SelectItem value="other">Inne</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  (locationType === "physical" || locationType === "hybrid") && (
                    <>
                      <div>
                        <Label htmlFor="location_name">Nazwa miejsca</Label>
                        <Input
                          id="location_name"
                          placeholder="np. Studio Tańca Salsa"
                          className="mt-1"
                          {...register("location_name")}
                        />
                      </div>

                      <div>
                        <Label htmlFor="address">
                          Adres <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="address"
                          placeholder="ul. Taneczna 10"
                          className="mt-1"
                          {...register("address", {
                            required:
                              (locationType === "physical" || locationType === "hybrid")
                                ? "Adres jest wymagany"
                                : false,
                          })}
                        />
                        {errors.address && (
                          <p className="text-sm text-red-500 mt-1">
                            {String(errors.address.message)}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="city">
                          Miasto <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="city"
                          placeholder="Warszawa"
                          className="mt-1"
                          {...register("city", {
                            required:
                              (locationType === "physical" || locationType === "hybrid")
                                ? "Miasto jest wymagane"
                                : false,
                          })}
                        />
                        {errors.city && (
                          <p className="text-sm text-red-500 mt-1">
                            {String(errors.city.message)}
                          </p>
                        )}
                      </div>
                    </>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Szczegóły */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ostatnie szczegóły</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price */}
                <div>
                  <Label htmlFor="price_amount">Cena (PLN)</Label>
                  <Input
                    id="price_amount"
                    type="number"
                    min="0"
                    step="5"
                    placeholder="0"
                    className="mt-1"
                    {...register("price_amount")}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Zostaw puste lub wpisz 0 dla wydarzenia darmowego
                  </p>
                </div>

                {/* Participants */}
                <div>
                  <Label htmlFor="max_participants">
                    Maksymalna liczba uczestników
                  </Label>
                  <Input
                    id="max_participants"
                    type="number"
                    min="1"
                    placeholder="Bez limitu"
                    className="mt-1"
                    {...register("max_participants")}
                  />
                </div>

                {/* Skill Level */}
                <div>
                  <Label htmlFor="skill_level_required">
                    Poziom zaawansowania
                  </Label>
                  <Select
                    value={watch("skill_level_required")}
                    onValueChange={(value) =>
                      setValue("skill_level_required", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Dla każdego" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Początkujący</SelectItem>
                      <SelectItem value="intermediate">
                        Średniozaawansowany
                      </SelectItem>
                      <SelectItem value="advanced">Zaawansowany</SelectItem>
                      <SelectItem value="professional">
                        Profesjonalny
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Partner Required */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label
                      htmlFor="requires_partner"
                      className="text-base font-medium"
                    >
                      Wymagany partner
                    </Label>
                    <p className="text-sm text-gray-600">
                      Czy uczestnicy muszą przyjść w parach?
                    </p>
                  </div>
                  <Switch
                    id="requires_partner"
                    checked={watch("requires_partner")}
                    onCheckedChange={(checked) =>
                      setValue("requires_partner", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">Podsumowanie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nazwa:</span>
                  <span className="font-medium">{watch("title")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-medium">
                    {watch("event_date") &&
                      format(new Date(watch("event_date")), "d MMMM yyyy", {
                        locale: pl,
                      })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Godzina:</span>
                  <span className="font-medium">
                    {watch("start_time")} - {watch("end_time")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cena:</span>
                  <span className="font-medium">
                    {priceAmount ? `${priceAmount} PLN` : "Darmowe"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Wstecz
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!isStepValid()}
            >
              Dalej
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Tworzenie..." : "Utwórz wydarzenie"}
            </Button>
          )}
        </div>
      </form> 

      {/* Facebook Import Sheet */}
      <FacebookImportSheet
        open={showFacebookImport}
        onOpenChange={setShowFacebookImport}
        onImportSuccess={handleFacebookImport}
      />

      {/* AI Assistant Sheet */}
      <AIAssistantSheet
        open={showAIAssistant}
        onOpenChange={setShowAIAssistant}
        onGenerateSuccess={handleAIAssistant}
      />
    </div>
  );
};