// src/pages/events/edit.tsx
import { useForm } from "@refinedev/react-hook-form";
import { useGetIdentity } from "@refinedev/core";
import { useNavigate, useParams } from "react-router-dom";
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
  Clock, 
  MapPin, 
  DollarSign, 
  Users, 
  Music, 
  Info,
} from "lucide-react";
import { Button, Input, Textarea, Switch } from "@/components/ui";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabaseClient } from "@/utility";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface DanceStyle {
  id: string;
  name: string;
  category: string;
}

interface EventFormData {
  title: string;
  event_type: string;
  dance_style_id?: string;
  description: string;
  start_at: string;
  end_at: string;
  location_type: string;
  online_platform?: string;
  online_link?: string;
  location_name?: string;
  address?: string;
  city?: string;
  max_participants?: string;
  skill_level_min?: string;
  skill_level_max?: string;
  requires_partner: boolean;
  price: string;
  currency: string;
  visibility: string;
  status: string;
}

export const EventsEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { data: identity } = useGetIdentity<any>();
  const navigate = useNavigate();
  
  // PROSTE STANY - TAK JAK W PROFILACH
  const [eventData, setEventData] = useState<any>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [danceStyles, setDanceStyles] = useState<DanceStyle[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>();

  // Pobierz style tańca - TAK JAK W CREATE
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

  // Pobierz dane wydarzenia - DOKŁADNIE JAK W PROFILACH
  useEffect(() => {
    if (!id) return;
    
    setIsLoadingEvent(true);
    setError(null);
    
    supabaseClient
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching event:', error);
          setError('Nie udało się pobrać wydarzenia');
        } else if (data) {
          setEventData(data);
          
          // Konwertuj daty do formatu datetime-local
          const startDate = new Date(data.start_at);
          const endDate = new Date(data.end_at);
          
          const formatDateTimeLocal = (date: Date) => {
            const pad = (num: number) => String(num).padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
          };
          
          // Wypełnij formularz
          reset({
            title: data.title,
            event_type: data.event_type,
            dance_style_id: data.dance_style_id || "",
            description: data.description || "",
            start_at: formatDateTimeLocal(startDate),
            end_at: formatDateTimeLocal(endDate),
            location_type: data.location_type,
            online_platform: data.online_platform || "",
            online_link: data.online_link || "",
            location_name: data.location_name || "",
            address: data.address || "",
            city: data.city || "",
            max_participants: data.max_participants?.toString() || "",
            skill_level_min: data.skill_level_min || "all",
            skill_level_max: data.skill_level_max || "all",
            requires_partner: data.requires_partner || false,
            price: data.price?.toString() || "0",
            currency: data.currency || "PLN",
            visibility: data.visibility || "public",
            status: data.status || "published",
          });
        }
        setIsLoadingEvent(false);
      });
  }, [id, reset]);

  const locationType = watch("location_type");

  // PROSTA FUNKCJA SUBMIT - BEZ REFINE UPDATE
  const handleFormSubmit = async (data: any) => {
    if (!identity?.id) {
      toast.error("Musisz być zalogowany");
      return;
    }

    if (!eventData || eventData.organizer_id !== identity.id) {
      toast.error("Nie masz uprawnień do edycji tego wydarzenia");
      return;
    }

    try {
      const updateData = {
        title: data.title,
        description: data.description || null,
        event_type: data.event_type,
        dance_style_id: data.dance_style_id || null,
        start_at: new Date(data.start_at).toISOString(),
        end_at: new Date(data.end_at).toISOString(),
        location_type: data.location_type,
        location_name: data.location_name || null,
        address: data.address || null,
        city: data.city || null,
        online_platform: data.online_platform || null,
        online_link: data.online_link || null,
        price: parseFloat(data.price) || 0,
        currency: data.currency,
        max_participants: data.max_participants ? parseInt(data.max_participants) : null,
        skill_level_min: data.skill_level_min === "all" ? null : data.skill_level_min || null,
        skill_level_max: data.skill_level_max === "all" ? null : data.skill_level_max || null,
        requires_partner: data.requires_partner || false,
        visibility: data.visibility,
        status: data.status,
      };

      // BEZPOŚREDNIO SUPABASE - TAK JAK W PROFILACH
      const { error } = await supabaseClient
        .from("events")
        .update(updateData)
        .eq("id", id!);

      if (error) throw error;

      toast.success("Wydarzenie zostało zaktualizowane!");
      navigate(`/events/show/${id}`);
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error("Błąd aktualizacji", {
        description: error.message || "Spróbuj ponownie",
      });
    }
  };

  // PROSTE STANY ŁADOWANIA - TAK JAK W PROFILACH
  if (isLoadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Ładowanie wydarzenia...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg">{error || 'Wydarzenie nie zostało znalezione'}</p>
        <Button className="mt-4" onClick={() => navigate("/events")}>
          Wróć do listy
        </Button>
      </div>
    );
  }

  if (eventData.organizer_id !== identity?.id) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg">Nie masz uprawnień do edycji tego wydarzenia</p>
        <Button className="mt-4" onClick={() => navigate(`/events/show/${id}`)}>
          Wróć do wydarzenia
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/events/show/${id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anuluj
          </Button>
          <h1 className="font-semibold text-xl">Edytuj wydarzenie</h1>
          <div className="w-20" />
        </div>
      </div>

      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="max-w-5xl mx-auto px-4 py-6 space-y-6"
      >
        {/* Podstawowe informacje */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Podstawowe informacje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">
                Nazwa wydarzenia <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                className="mt-1"
                {...register("title", {
                  required: "Nazwa jest wymagana",
                  minLength: {
                    value: 5,
                    message: "Nazwa musi mieć minimum 5 znaków",
                  },
                })}
              />
              {errors.title && typeof errors.title.message === 'string' && (
                <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Typ wydarzenia</Label>
                <Select
                  value={watch("event_type")}
                  onValueChange={(value) => setValue("event_type", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson">Lekcja</SelectItem>
                    <SelectItem value="workshop">Warsztaty</SelectItem>
                    <SelectItem value="social">Potańcówka</SelectItem>
                    <SelectItem value="competition">Zawody</SelectItem>
                    <SelectItem value="performance">Występ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Styl tańca</Label>
                <Select
                  value={watch("dance_style_id")}
                  onValueChange={(value) => setValue("dance_style_id", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Wybierz styl" />
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
          </CardContent>
        </Card>

        {/* Data i czas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Data i czas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_at">
                  Data i godzina rozpoczęcia <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="start_at"
                  type="datetime-local"
                  className="mt-1"
                  {...register("start_at", {
                    required: "Data rozpoczęcia jest wymagana",
                  })}
                />
               {errors.start_at && typeof errors.start_at.message === 'string' && (
                  <p className="text-sm text-red-500 mt-1">{errors.start_at.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="end_at">
                  Data i godzina zakończenia <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="end_at"
                  type="datetime-local"
                  className="mt-1"
                  {...register("end_at", {
                    required: "Data zakończenia jest wymagana",
                  })}
                />
               {errors.end_at && typeof errors.end_at.message === 'string' && (
                  <p className="text-sm text-red-500 mt-1">{errors.end_at.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lokalizacja */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Lokalizacja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Typ lokalizacji</Label>
              <RadioGroup
                value={locationType}
                onValueChange={(value) => setValue("location_type", value)}
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="physical" id="physical" />
                  <Label htmlFor="physical" className="font-normal">
                    Stacjonarne
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="online" />
                  <Label htmlFor="online" className="font-normal">
                    Online
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hybrid" id="hybrid" />
                  <Label htmlFor="hybrid" className="font-normal">
                    Hybrydowe
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {locationType === "online" ? (
              <>
                <div>
                  <Label htmlFor="online_platform">Platforma</Label>
                  <Input
                    id="online_platform"
                    placeholder="np. Zoom, Google Meet"
                    className="mt-1"
                    {...register("online_platform")}
                  />
                </div>
                <div>
                  <Label htmlFor="online_link">Link do spotkania</Label>
                  <Input
                    id="online_link"
                    type="url"
                    placeholder="https://..."
                    className="mt-1"
                    {...register("online_link")}
                  />
                </div>
              </>
            ) : (
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
                  <Label htmlFor="address">Adres</Label>
                  <Input
                    id="address"
                    placeholder="ul. Taneczna 10"
                    className="mt-1"
                    {...register("address")}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Miasto</Label>
                  <Input
                    id="city"
                    placeholder="Warszawa"
                    className="mt-1"
                    {...register("city")}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Szczegóły */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Szczegóły
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Cena (PLN)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="5"
                  className="mt-1"
                  {...register("price")}
                />
              </div>

              <div>
                <Label htmlFor="max_participants">Max. liczba uczestników</Label>
                <Input
                  id="max_participants"
                  type="number"
                  min="1"
                  placeholder="Bez limitu"
                  className="mt-1"
                  {...register("max_participants")}
                />
              </div>

              <div>
                <Label>Poziom minimalny</Label>
                <Select
                  value={watch("skill_level_min")}
                  onValueChange={(value) => setValue("skill_level_min", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Dla każdego" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Dla każdego</SelectItem>
                    <SelectItem value="beginner">Początkujący</SelectItem>
                    <SelectItem value="intermediate">Średniozaawansowany</SelectItem>
                    <SelectItem value="advanced">Zaawansowany</SelectItem>
                    <SelectItem value="professional">Profesjonalny</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Poziom maksymalny</Label>
                <Select
                  value={watch("skill_level_max")}
                  onValueChange={(value) => setValue("skill_level_max", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Bez ograniczeń" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Bez ograniczeń</SelectItem>
                    <SelectItem value="beginner">Początkujący</SelectItem>
                    <SelectItem value="intermediate">Średniozaawansowany</SelectItem>
                    <SelectItem value="advanced">Zaawansowany</SelectItem>
                    <SelectItem value="professional">Profesjonalny</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base font-medium">Wymagany partner</Label>
                <p className="text-sm text-muted-foreground">
                  Czy uczestnicy muszą przyjść w parach?
                </p>
              </div>
              <Switch
                checked={watch("requires_partner")}
                onCheckedChange={(checked) => setValue("requires_partner", checked)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Szkic</SelectItem>
                    <SelectItem value="published">Opublikowane</SelectItem>
                    <SelectItem value="cancelled">Odwołane</SelectItem>
                    <SelectItem value="completed">Zakończone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Widoczność</Label>
                <Select
                  value={watch("visibility")}
                  onValueChange={(value) => setValue("visibility", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Publiczne</SelectItem>
                    <SelectItem value="private">Prywatne</SelectItem>
                    <SelectItem value="unlisted">Niewidoczne w liście</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Przyciski akcji */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/events/show/${id}`)}
          >
            Anuluj
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </div>
      </form>
    </div>
  );
};