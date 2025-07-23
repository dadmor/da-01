// ------ src/pages/events/edit.tsx ------
import { useForm } from "@refinedev/react-hook-form";
import { useGetIdentity, useUpdate, useList, useShow } from "@refinedev/core";
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
  CalendarDays, 
  MapPin, 
  Globe, 
  DollarSign,
  Users,
  Music,
  Info,
  Clock,
  GraduationCap,
  Trophy,
  PartyPopper,
  BookOpen,
  Mic,
  CheckCircle2,
  Link as LinkIcon,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Button, Input, Textarea, Switch } from "@/components/ui";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Form, FormActions, FormControl } from "@/components/form";
import { SubPage } from "@/components/layout";
import { toast } from "sonner";
import { useEffect } from "react";
import { useLoading } from "@/utility";

interface DanceStyle {
  id: string;
  name: string;
  is_active: boolean;
}

interface Event {
  id: string;
  organizer_id: string;
  title: string;
  description?: string;
  event_type: string;
  dance_style_id?: string;
  start_at: string;
  end_at: string;
  is_recurring: boolean;
  location_type: string;
  location_name?: string;
  address?: string;
  city?: string;
  online_platform?: string;
  online_link?: string;
  website_url?: string;
  registration_url?: string;
  min_participants: number;
  max_participants?: number;
  skill_level_min?: string;
  skill_level_max?: string;
  price: number;
  currency: string;
  early_bird_price?: number;
  early_bird_deadline?: string;
  requires_partner: boolean;
  age_min?: number;
  age_max?: number;
  status: string;
  visibility: string;
}

export const EventsEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { data: identity } = useGetIdentity<any>();
  const navigate = useNavigate();
  const { mutate: updateEvent } = useUpdate();

  // Pobierz dane wydarzenia
  const { queryResult } = useShow({
    resource: "events",
    id: id!,
  });

  const { data: eventData, isLoading, isError } = queryResult;
  const event = eventData?.data as Event;

  // Pobierz listę stylów tańca
  const { data: danceStylesData } = useList<DanceStyle>({
    resource: "dance_styles",
    filters: [
      {
        field: "is_active",
        operator: "eq",
        value: true,
      },
    ],
    sorters: [
      {
        field: "name",
        order: "asc",
      },
    ],
  });

  const danceStyles = danceStylesData?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Ustaw wartości formularza po załadowaniu danych
  useEffect(() => {
    if (event) {
      // Konwertuj daty do formatu datetime-local
      const startDate = new Date(event.start_at).toISOString().slice(0, 16);
      const endDate = new Date(event.end_at).toISOString().slice(0, 16);
      
      reset({
        ...event,
        start_at: startDate,
        end_at: endDate,
        early_bird_deadline: event.early_bird_deadline 
          ? new Date(event.early_bird_deadline).toISOString().slice(0, 10)
          : "",
      });
    }
  }, [event, reset]);

  const init = useLoading({ isLoading, isError });
  if (init) return init;

  // Sprawdź czy użytkownik jest organizatorem
  if (event && event.organizer_id !== identity?.id) {
    return (
      <SubPage>
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Nie masz uprawnień do edycji tego wydarzenia</p>
          <Button 
            className="mt-4" 
            onClick={() => navigate(`/events/show/${id}`)}
          >
            Wróć do wydarzenia
          </Button>
        </div>
      </SubPage>
    );
  }

  const watchLocationType = watch("location_type");
  const watchEventType = watch("event_type");
  const watchPrice = watch("price");
  const watchStartAt = watch("start_at");
  const watchSkillLevelMin = watch("skill_level_min");

  const onFinish = (values: any) => {
    // Walidacja dat
    if (new Date(values.start_at) >= new Date(values.end_at)) {
      toast.error("Data zakończenia musi być po dacie rozpoczęcia");
      return;
    }

    // Przygotuj dane
    const eventData = {
      ...values,
      // Konwertuj puste stringi na null
      dance_style_id: values.dance_style_id || null,
      max_participants: values.max_participants || null,
      early_bird_price: values.early_bird_price || null,
      early_bird_deadline: values.early_bird_deadline || null,
      age_min: values.age_min || null,
      age_max: values.age_max || null,
      website_url: values.website_url || null,
      registration_url: values.registration_url || null,
      location_name: values.location_name || null,
      address: values.address || null,
      city: values.city || null,
      online_platform: values.online_platform || null,
      online_link: values.online_link || null,
    };

    updateEvent(
      {
        resource: "events",
        id: id!,
        values: eventData,
      },
      {
        onSuccess: () => {
          toast.success("Wydarzenie zostało zaktualizowane!");
          navigate(`/events/show/${id}`);
        },
        onError: (error: any) => {
          console.error("Update error:", error);
          toast.error("Błąd aktualizacji wydarzenia", {
            description: error.message || "Spróbuj ponownie",
          });
        },
      }
    );
  };

  const getEventTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      lesson: <BookOpen className="w-4 h-4" />,
      workshop: <GraduationCap className="w-4 h-4" />,
      social: <PartyPopper className="w-4 h-4" />,
      competition: <Trophy className="w-4 h-4" />,
      performance: <Mic className="w-4 h-4" />,
    };
    return icons[type] || <CalendarDays className="w-4 h-4" />;
  };

  return (
    <SubPage>
      <FlexBox>
        <Lead
          title="Edytuj wydarzenie"
          description="Zaktualizuj informacje o wydarzeniu"
        />
        <Button
          variant="outline"
          onClick={() => navigate(`/events/show/${id}`)}
        >
          Anuluj
        </Button>
      </FlexBox>

      <Form onSubmit={handleSubmit(onFinish)}>
        <GridBox variant="1-1-1">
          {/* Podstawowe informacje */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Podstawowe informacje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormControl
                label="Tytuł wydarzenia"
                htmlFor="title"
                error={errors.title?.message as string}
                required
              >
                <Input
                  id="title"
                  placeholder="np. Warsztaty Salsy dla początkujących"
                  {...register("title", {
                    required: "Tytuł jest wymagany",
                    minLength: {
                      value: 5,
                      message: "Tytuł musi mieć minimum 5 znaków",
                    },
                    maxLength: {
                      value: 100,
                      message: "Tytuł może mieć maksymalnie 100 znaków",
                    },
                  })}
                />
              </FormControl>

              <FormControl
                label="Opis"
                htmlFor="description"
                error={errors.description?.message as string}
              >
                <Textarea
                  id="description"
                  rows={6}
                  placeholder="Opisz swoje wydarzenie..."
                  {...register("description", {
                    maxLength: {
                      value: 2000,
                      message: "Opis może mieć maksymalnie 2000 znaków",
                    },
                  })}
                />
              </FormControl>

              <GridBox variant="1-2-2">
                <FormControl
                  label="Typ wydarzenia"
                  error={errors.event_type?.message as string}
                  required
                >
                  <Select
                    value={watch("event_type")}
                    onValueChange={(value) => setValue("event_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz typ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lesson">
                        {getEventTypeIcon("lesson")}
                        <span className="ml-2">Lekcja</span>
                      </SelectItem>
                      <SelectItem value="workshop">
                        {getEventTypeIcon("workshop")}
                        <span className="ml-2">Warsztaty</span>
                      </SelectItem>
                      <SelectItem value="social">
                        {getEventTypeIcon("social")}
                        <span className="ml-2">Potańcówka</span>
                      </SelectItem>
                      <SelectItem value="competition">
                        {getEventTypeIcon("competition")}
                        <span className="ml-2">Zawody</span>
                      </SelectItem>
                      <SelectItem value="performance">
                        {getEventTypeIcon("performance")}
                        <span className="ml-2">Występ</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>

                <FormControl
                  label="Styl tańca"
                  error={errors.dance_style_id?.message as string}
                >
                  <Select
                    value={watch("dance_style_id") || ""}
                    onValueChange={(value) => setValue("dance_style_id", value)}
                  >
                    <SelectTrigger>
                      <Music className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Wybierz styl" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Brak / Różne style</SelectItem>
                      {danceStyles.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </GridBox>
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
            <CardContent>
              <GridBox variant="1-2-2">
                <FormControl
                  label="Data i godzina rozpoczęcia"
                  htmlFor="start_at"
                  error={errors.start_at?.message as string}
                  required
                >
                  <Input
                    id="start_at"
                    type="datetime-local"
                    {...register("start_at", {
                      required: "Data rozpoczęcia jest wymagana",
                    })}
                  />
                </FormControl>

                <FormControl
                  label="Data i godzina zakończenia"
                  htmlFor="end_at"
                  error={errors.end_at?.message as string}
                  required
                >
                  <Input
                    id="end_at"
                    type="datetime-local"
                    {...register("end_at", {
                      required: "Data zakończenia jest wymagana",
                    })}
                  />
                </FormControl>
              </GridBox>

              <FormControl label="Wydarzenie cykliczne">
                <FlexBox variant="start">
                  <Switch
                    checked={watch("is_recurring") || false}
                    onCheckedChange={(checked) => setValue("is_recurring", checked)}
                  />
                  <span className="text-sm text-muted-foreground">
                    To wydarzenie powtarza się regularnie
                  </span>
                </FlexBox>
              </FormControl>
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
            <CardContent>
              <FormControl
                label="Typ lokalizacji"
                error={errors.location_type?.message as string}
                required
              >
                <Select
                  value={watch("location_type")}
                  onValueChange={(value) => setValue("location_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">
                      <MapPin className="w-4 h-4 mr-2 inline" />
                      Stacjonarne
                    </SelectItem>
                    <SelectItem value="online">
                      <Globe className="w-4 h-4 mr-2 inline" />
                      Online
                    </SelectItem>
                    <SelectItem value="hybrid">
                      <Users className="w-4 h-4 mr-2 inline" />
                      Hybrydowe
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>

              {(watchLocationType === "physical" || watchLocationType === "hybrid") && (
                <>
                  <FormControl
                    label="Nazwa miejsca"
                    htmlFor="location_name"
                    error={errors.location_name?.message as string}
                  >
                    <Input
                      id="location_name"
                      placeholder="np. Szkoła Tańca Salsa"
                      {...register("location_name")}
                    />
                  </FormControl>

                  <FormControl
                    label="Adres"
                    htmlFor="address"
                    error={errors.address?.message as string}
                  >
                    <Input
                      id="address"
                      placeholder="np. ul. Taneczna 10"
                      {...register("address")}
                    />
                  </FormControl>

                  <FormControl
                    label="Miasto"
                    htmlFor="city"
                    error={errors.city?.message as string}
                  >
                    <Input
                      id="city"
                      placeholder="np. Warszawa"
                      {...register("city")}
                    />
                  </FormControl>
                </>
              )}

              {(watchLocationType === "online" || watchLocationType === "hybrid") && (
                <>
                  <FormControl
                    label="Platforma"
                    htmlFor="online_platform"
                    error={errors.online_platform?.message as string}
                  >
                    <Input
                      id="online_platform"
                      placeholder="np. Zoom, Google Meet"
                      {...register("online_platform")}
                    />
                  </FormControl>

                  <FormControl
                    label="Link do spotkania"
                    htmlFor="online_link"
                    error={errors.online_link?.message as string}
                  >
                    <Input
                      id="online_link"
                      type="url"
                      placeholder="https://..."
                      {...register("online_link")}
                    />
                  </FormControl>
                </>
              )}
            </CardContent>
          </Card>
        </GridBox>

        <GridBox variant="1-2-2">
          {/* Uczestnicy i poziom */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Uczestnicy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GridBox variant="1-2-2">
                <FormControl
                  label="Min. liczba uczestników"
                  htmlFor="min_participants"
                  error={errors.min_participants?.message as string}
                >
                  <Input
                    id="min_participants"
                    type="number"
                    min="1"
                    {...register("min_participants", {
                      valueAsNumber: true,
                      min: { value: 1, message: "Minimum 1 uczestnik" },
                    })}
                  />
                </FormControl>

                <FormControl
                  label="Max. liczba uczestników"
                  htmlFor="max_participants"
                  error={errors.max_participants?.message as string}
                >
                  <Input
                    id="max_participants"
                    type="number"
                    min="1"
                    placeholder="Brak limitu"
                    {...register("max_participants", {
                      valueAsNumber: true,
                      min: { value: 1, message: "Minimum 1 uczestnik" },
                    })}
                  />
                </FormControl>

                <FormControl
                  label="Poziom minimalny"
                  error={errors.skill_level_min?.message as string}
                >
                  <Select
                    value={watch("skill_level_min")}
                    onValueChange={(value) => {
                      setValue("skill_level_min", value);
                      // Jeśli poziom max jest niższy niż min, wyrównaj
                      const levels = ["beginner", "intermediate", "advanced", "professional"];
                      const minIndex = levels.indexOf(value);
                      const maxIndex = levels.indexOf(watch("skill_level_max"));
                      if (maxIndex < minIndex) {
                        setValue("skill_level_max", value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz poziom" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Początkujący</SelectItem>
                      <SelectItem value="intermediate">Średniozaawansowany</SelectItem>
                      <SelectItem value="advanced">Zaawansowany</SelectItem>
                      <SelectItem value="professional">Profesjonalny</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>

                <FormControl
                  label="Poziom maksymalny"
                  error={errors.skill_level_max?.message as string}
                >
                  <Select
                    value={watch("skill_level_max")}
                    onValueChange={(value) => setValue("skill_level_max", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz poziom" />
                    </SelectTrigger>
                    <SelectContent>
                      {(!watchSkillLevelMin || watchSkillLevelMin === "beginner") && (
                        <SelectItem value="beginner">Początkujący</SelectItem>
                      )}
                      {(!watchSkillLevelMin || watchSkillLevelMin === "beginner" || watchSkillLevelMin === "intermediate") && (
                        <SelectItem value="intermediate">Średniozaawansowany</SelectItem>
                      )}
                      {(!watchSkillLevelMin || watchSkillLevelMin === "beginner" || watchSkillLevelMin === "intermediate" || watchSkillLevelMin === "advanced") && (
                        <SelectItem value="advanced">Zaawansowany</SelectItem>
                      )}
                      <SelectItem value="professional">Profesjonalny</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </GridBox>

              <FormControl label="Wymagany partner">
                <FlexBox variant="start">
                  <Switch
                    checked={watch("requires_partner") || false}
                    onCheckedChange={(checked) => setValue("requires_partner", checked)}
                  />
                  <span className="text-sm text-muted-foreground">
                    Uczestnicy muszą przyjść w parach
                  </span>
                </FlexBox>
              </FormControl>

              <GridBox variant="1-2-2">
                <FormControl
                  label="Wiek minimalny"
                  htmlFor="age_min"
                  error={errors.age_min?.message as string}
                >
                  <Input
                    id="age_min"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Brak ograniczeń"
                    {...register("age_min", {
                      valueAsNumber: true,
                      min: { value: 0, message: "Minimum 0 lat" },
                      max: { value: 100, message: "Maksimum 100 lat" },
                    })}
                  />
                </FormControl>

                <FormControl
                  label="Wiek maksymalny"
                  htmlFor="age_max"
                  error={errors.age_max?.message as string}
                >
                  <Input
                    id="age_max"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Brak ograniczeń"
                    {...register("age_max", {
                      valueAsNumber: true,
                      min: { value: 0, message: "Minimum 0 lat" },
                      max: { value: 100, message: "Maksimum 100 lat" },
                    })}
                  />
                </FormControl>
              </GridBox>
            </CardContent>
          </Card>

          {/* Cena i płatności */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Cena i płatności
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GridBox variant="1-2-2">
                <FormControl
                  label="Cena"
                  htmlFor="price"
                  error={errors.price?.message as string}
                  required
                >
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register("price", {
                      valueAsNumber: true,
                      min: { value: 0, message: "Cena nie może być ujemna" },
                    })}
                  />
                </FormControl>

                <FormControl
                  label="Waluta"
                  error={errors.currency?.message as string}
                >
                  <Select
                    value={watch("currency")}
                    onValueChange={(value) => setValue("currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz walutę" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLN">PLN</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </GridBox>

              {watchPrice > 0 && (
                <>
                  <GridBox variant="1-2-2">
                    <FormControl
                      label="Cena Early Bird"
                      htmlFor="early_bird_price"
                      error={errors.early_bird_price?.message as string}
                    >
                      <Input
                        id="early_bird_price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Opcjonalne"
                        {...register("early_bird_price", {
                          valueAsNumber: true,
                          min: { value: 0, message: "Cena nie może być ujemna" },
                        })}
                      />
                    </FormControl>

                    <FormControl
                      label="Early Bird do"
                      htmlFor="early_bird_deadline"
                      error={errors.early_bird_deadline?.message as string}
                    >
                      <Input
                        id="early_bird_deadline"
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        max={watchStartAt ? watchStartAt.split("T")[0] : undefined}
                        {...register("early_bird_deadline")}
                      />
                    </FormControl>
                  </GridBox>
                </>
              )}
            </CardContent>
          </Card>
        </GridBox>

        {/* Dodatkowe informacje */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Dodatkowe informacje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GridBox variant="1-2-2">
              <FormControl
                label="Strona wydarzenia"
                htmlFor="website_url"
                error={errors.website_url?.message as string}
              >
                <Input
                  id="website_url"
                  type="url"
                  placeholder="https://..."
                  {...register("website_url")}
                />
              </FormControl>

              <FormControl
                label="Link do zewnętrznej rejestracji"
                htmlFor="registration_url"
                error={errors.registration_url?.message as string}
              >
                <Input
                  id="registration_url"
                  type="url"
                  placeholder="https://..."
                  {...register("registration_url")}
                />
              </FormControl>

              <FormControl
                label="Status"
                error={errors.status?.message as string}
                required
              >
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <AlertCircle className="w-4 h-4 mr-2 inline text-gray-500" />
                      Szkic
                    </SelectItem>
                    <SelectItem value="published">
                      <CheckCircle2 className="w-4 h-4 mr-2 inline text-green-500" />
                      Opublikowane
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <XCircle className="w-4 h-4 mr-2 inline text-red-500" />
                      Odwołane
                    </SelectItem>
                    <SelectItem value="completed">
                      <CheckCircle2 className="w-4 h-4 mr-2 inline text-blue-500" />
                      Zakończone
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>

              <FormControl
                label="Widoczność"
                error={errors.visibility?.message as string}
              >
                <Select
                  value={watch("visibility")}
                  onValueChange={(value) => setValue("visibility", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz widoczność" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Publiczne</SelectItem>
                    <SelectItem value="private">Prywatne</SelectItem>
                    <SelectItem value="unlisted">Niewidoczne w liście</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </GridBox>
          </CardContent>
        </Card>

        <FormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/events/show/${id}`)}
          >
            Anuluj
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </FormActions>
      </Form>
    </SubPage>
  );
};