// src/pages/events/create.tsx
import { useState, useEffect } from "react";
import { useForm } from "@refinedev/react-hook-form";
import { useNavigation, useGetIdentity } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Form, FormActions, FormControl } from "@/components/form";
import { supabaseClient } from "@/utility";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UserIdentity, DanceStyle } from "../dancers/dancers";

const eventCategories = [
  { value: "lesson", label: "Lekcja indywidualna" },
  { value: "workshop", label: "Warsztaty" },
  { value: "outdoor", label: "Wydarzenie plenerowe" },
  { value: "party", label: "Impreza taneczna" },
  { value: "course", label: "Kurs" },
];

const eventFormats = [
  { value: "individual", label: "Indywidualne" },
  { value: "couple", label: "W parach" },
  { value: "group", label: "Grupowe" },
  { value: "open", label: "Otwarte" },
];

const locationTypes = [
  { value: "address", label: "Adres" },
  { value: "online", label: "Online" },
  { value: "client_location", label: "U klienta" },
];

const skillLevels = [
  { value: "beginner", label: "Początkujący" },
  { value: "intermediate", label: "Średniozaawansowany" },
  { value: "advanced", label: "Zaawansowany" },
  { value: "professional", label: "Profesjonalny" },
];

export const EventsCreate = () => {
  const { list } = useNavigation();
  const navigate = useNavigate();
  const { data: identity } = useGetIdentity<UserIdentity>();
  const [danceStyles, setDanceStyles] = useState<DanceStyle[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [currentRequirement, setCurrentRequirement] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      event_category: "lesson",
      event_format: "individual",
      location_type: "address",
      visibility: "public",
      status: "active",
      price_currency: "PLN",
      price_per: "person",
      is_recurring: false,
      requires_partner: false,
      provides_partner: false,
    },
  });

  const eventCategory = watch("event_category");
  const locationType = watch("location_type");
  const isRecurring = watch("is_recurring");

  useEffect(() => {
    fetchDanceStyles();
  }, []);

  const fetchDanceStyles = async () => {
    const { data } = await supabaseClient
      .from("dance_styles")
      .select("id, name, category")
      .order("name");
    
    if (data) {
      setDanceStyles(data);
    }
  };

  const addTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addRequirement = () => {
    if (currentRequirement && !requirements.includes(currentRequirement)) {
      setRequirements([...requirements, currentRequirement]);
      setCurrentRequirement("");
    }
  };

  const removeRequirement = (req: string) => {
    setRequirements(requirements.filter(r => r !== req));
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (!identity?.id) {
        alert("Musisz być zalogowany");
        return;
      }

      // Przygotuj dane wydarzenia
      const eventData = {
        organizer_id: identity.id,
        ...data,
        tags: tags.length > 0 ? tags : null,
        requirements: requirements.length > 0 ? requirements : null,
        start_datetime: new Date(`${data.event_date}T${data.start_time}`).toISOString(),
        end_datetime: new Date(`${data.event_date}T${data.end_time}`).toISOString(),
        price_amount: data.price_amount && data.price_amount !== '' ? parseFloat(data.price_amount) : null,
        max_participants: data.max_participants && data.max_participants !== '' ? parseInt(data.max_participants) : null,
        min_participants: data.min_participants && data.min_participants !== '' ? parseInt(data.min_participants) : 1,
        age_min: data.age_min && data.age_min !== '' ? parseInt(data.age_min) : null,
        age_max: data.age_max && data.age_max !== '' ? parseInt(data.age_max) : null,
        early_bird_discount: data.early_bird_discount && data.early_bird_discount !== '' ? parseFloat(data.early_bird_discount) : null,
        current_participants: 0,
      };

      // Usuń niepotrzebne pola
      delete eventData.event_date;
      delete eventData.start_time;
      delete eventData.end_time;

      const { data: insertedEvent, error } = await supabaseClient
        .from("events")
        .insert(eventData)
        .select()
        .single();

      if (error) {
        console.error("Error creating event:", error);
        alert(`Błąd tworzenia wydarzenia: ${error.message}`);
        return;
      }

      alert("Wydarzenie zostało utworzone!");
      navigate(`/events/show/${insertedEvent.id}`);
      
    } catch (error) {
      console.error("Error:", error);
      alert("Wystąpił błąd podczas tworzenia wydarzenia");
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => list("events")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Powrót
      </Button>

      <FlexBox>
        <Lead
          title="Utwórz wydarzenie"
          description="Dodaj nową lekcję, warsztaty lub wydarzenie taneczne"
        />
      </FlexBox>

      <Form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="max-w-4xl mx-auto"
      >
        <GridBox>
          {/* Left Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Podstawowe informacje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormControl
                  label="Tytuł wydarzenia"
                  htmlFor="title"
                  error={errors.title?.message as string}
                  required
                >
                  <Input
                    id="title"
                    placeholder="np. Lekcja salsy dla początkujących"
                    {...register("title", {
                      required: "Tytuł jest wymagany",
                      minLength: {
                        value: 5,
                        message: "Tytuł musi mieć minimum 5 znaków"
                      }
                    })}
                  />
                </FormControl>

                <GridBox variant="1-2-2">
                  <FormControl
                    label="Kategoria"
                    htmlFor="event_category"
                    error={errors.event_category?.message as string}
                    required
                  >
                    <Select
                      value={watch("event_category")}
                      onValueChange={(value) => setValue("event_category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>

                  <FormControl
                    label="Format"
                    htmlFor="event_format"
                    error={errors.event_format?.message as string}
                    required
                  >
                    <Select
                      value={watch("event_format")}
                      onValueChange={(value) => setValue("event_format", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventFormats.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </GridBox>

                <FormControl
                  label="Styl tańca"
                  htmlFor="dance_style_id"
                  error={errors.dance_style_id?.message as string}
                >
                  <Select
                    value={watch("dance_style_id")}
                    onValueChange={(value) => setValue("dance_style_id", value)}
                  >
                    <SelectTrigger>
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
                </FormControl>

                <FormControl
                  label="Opis"
                  htmlFor="description"
                  error={errors.description?.message as string}
                  required
                >
                  <Textarea
                    id="description"
                    placeholder="Opisz swoje wydarzenie..."
                    rows={4}
                    {...register("description", {
                      required: "Opis jest wymagany",
                      minLength: {
                        value: 20,
                        message: "Opis musi mieć minimum 20 znaków"
                      }
                    })}
                  />
                </FormControl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Termin i czas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <GridBox variant="1-2-2">
                  <FormControl
                    label="Data"
                    htmlFor="event_date"
                    error={errors.event_date?.message as string}
                    required
                  >
                    <Input
                      id="event_date"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      {...register("event_date", {
                        required: "Data jest wymagana"
                      })}
                    />
                  </FormControl>

                  <FormControl
                    label="Godzina rozpoczęcia"
                    htmlFor="start_time"
                    error={errors.start_time?.message as string}
                    required
                  >
                    <Input
                      id="start_time"
                      type="time"
                      {...register("start_time", {
                        required: "Godzina rozpoczęcia jest wymagana"
                      })}
                    />
                  </FormControl>

                  <FormControl
                    label="Godzina zakończenia"
                    htmlFor="end_time"
                    error={errors.end_time?.message as string}
                    required
                  >
                    <Input
                      id="end_time"
                      type="time"
                      {...register("end_time", {
                        required: "Godzina zakończenia jest wymagana"
                      })}
                    />
                  </FormControl>
                </GridBox>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_recurring"
                    checked={isRecurring}
                    onCheckedChange={(checked) => setValue("is_recurring", checked)}
                  />
                  <Label htmlFor="is_recurring">Wydarzenie cykliczne</Label>
                </div>

                {isRecurring && (
                  <FormControl
                    label="Częstotliwość"
                    htmlFor="recurrence_rule"
                  >
                    <Input
                      id="recurrence_rule"
                      placeholder="np. Co tydzień w poniedziałki"
                      {...register("recurrence_rule")}
                    />
                  </FormControl>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lokalizacja</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormControl
                  label="Typ lokalizacji"
                  htmlFor="location_type"
                  error={errors.location_type?.message as string}
                  required
                >
                  <Select
                    value={locationType}
                    onValueChange={(value) => setValue("location_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {locationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>

                {locationType === "online" ? (
                  <>
                    <FormControl
                      label="Platforma"
                      htmlFor="online_platform"
                    >
                      <Select
                        value={watch("online_platform")}
                        onValueChange={(value) => setValue("online_platform", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz platformę" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="google_meet">Google Meet</SelectItem>
                          <SelectItem value="skype">Skype</SelectItem>
                          <SelectItem value="other">Inne</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>

                    <FormControl
                      label="Link do spotkania"
                      htmlFor="online_link"
                    >
                      <Input
                        id="online_link"
                        type="url"
                        placeholder="https://..."
                        {...register("online_link")}
                      />
                    </FormControl>
                  </>
                ) : locationType === "address" && (
                  <>
                    <FormControl
                      label="Nazwa miejsca"
                      htmlFor="location_name"
                    >
                      <Input
                        id="location_name"
                        placeholder="np. Studio Tańca Salsa"
                        {...register("location_name")}
                      />
                    </FormControl>

                    <FormControl
                      label="Adres"
                      htmlFor="address"
                      error={errors.address?.message as string}
                      required
                    >
                      <Input
                        id="address"
                        placeholder="ul. Przykładowa 1"
                        {...register("address", {
                          required: locationType === "address" ? "Adres jest wymagany" : false
                        })}
                      />
                    </FormControl>

                    <FormControl
                      label="Miasto"
                      htmlFor="city"
                      error={errors.city?.message as string}
                      required
                    >
                      <Input
                        id="city"
                        placeholder="Warszawa"
                        {...register("city", {
                          required: locationType === "address" ? "Miasto jest wymagane" : false
                        })}
                      />
                    </FormControl>


                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Uczestnicy i poziom</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <GridBox>
                  <FormControl
                    label="Min. uczestników"
                    htmlFor="min_participants"
                  >
                    <Input
                      id="min_participants"
                      type="number"
                      min="1"
                      placeholder="1"
                      {...register("min_participants")}
                    />
                  </FormControl>

                  <FormControl
                    label="Max. uczestników"
                    htmlFor="max_participants"
                  >
                    <Input
                      id="max_participants"
                      type="number"
                      min="1"
                      placeholder="Bez limitu"
                      {...register("max_participants")}
                    />
                  </FormControl>
                </GridBox>

                <GridBox>
                  <FormControl
                    label="Poziom od"
                    htmlFor="skill_level_required"
                  >
                    <Select
                      value={watch("skill_level_required")}
                      onValueChange={(value) => setValue("skill_level_required", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Dowolny" />
                      </SelectTrigger>
                      <SelectContent>
                        {skillLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>

                  <FormControl
                    label="Poziom do"
                    htmlFor="skill_level_max"
                  >
                    <Select
                      value={watch("skill_level_max")}
                      onValueChange={(value) => setValue("skill_level_max", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Dowolny" />
                      </SelectTrigger>
                      <SelectContent>
                        {skillLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </GridBox>

                <GridBox>
                  <FormControl
                    label="Wiek od"
                    htmlFor="age_min"
                  >
                    <Input
                      id="age_min"
                      type="number"
                      min="1"
                      max="100"
                      {...register("age_min")}
                    />
                  </FormControl>

                  <FormControl
                    label="Wiek do"
                    htmlFor="age_max"
                  >
                    <Input
                      id="age_max"
                      type="number"
                      min="1"
                      max="100"
                      {...register("age_max")}
                    />
                  </FormControl>
                </GridBox>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requires_partner"
                      checked={watch("requires_partner")}
                      onCheckedChange={(checked) => setValue("requires_partner", checked)}
                    />
                    <Label htmlFor="requires_partner">Wymagany partner</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="provides_partner"
                      checked={watch("provides_partner")}
                      onCheckedChange={(checked) => setValue("provides_partner", checked)}
                    />
                    <Label htmlFor="provides_partner">Zapewniam partnera</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cennik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <GridBox>
                  <FormControl
                    label="Cena"
                    htmlFor="price_amount"
                  >
                    <Input
                      id="price_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      {...register("price_amount")}
                    />
                  </FormControl>

                  <FormControl
                    label="Za"
                    htmlFor="price_per"
                  >
                    <Select
                      value={watch("price_per")}
                      onValueChange={(value) => setValue("price_per", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="person">Osobę</SelectItem>
                        <SelectItem value="couple">Parę</SelectItem>
                        <SelectItem value="hour">Godzinę</SelectItem>
                        <SelectItem value="course">Cały kurs</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </GridBox>

                <FormControl
                  label="Polityka anulowania"
                  htmlFor="cancellation_policy"
                >
                  <Textarea
                    id="cancellation_policy"
                    placeholder="np. Bezpłatna anulacja do 24h przed wydarzeniem"
                    rows={2}
                    {...register("cancellation_policy")}
                  />
                </FormControl>

                <FormControl
                  label="Zniżka Early Bird (%)"
                  htmlFor="early_bird_discount"
                >
                  <Input
                    id="early_bird_discount"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="np. 10"
                    {...register("early_bird_discount")}
                  />
                </FormControl>

                {watch("early_bird_discount") && (
                  <FormControl
                    label="Data końca Early Bird"
                    htmlFor="early_bird_deadline"
                  >
                    <Input
                      id="early_bird_deadline"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      {...register("early_bird_deadline")}
                    />
                  </FormControl>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dodatkowe informacje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormControl
                  label="Czego się spodziewać"
                  htmlFor="what_to_expect"
                >
                  <Textarea
                    id="what_to_expect"
                    placeholder="Co uczestnicy wyniosą z wydarzenia..."
                    rows={3}
                    {...register("what_to_expect")}
                  />
                </FormControl>

                <FormControl label="Wymagania">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="np. Wygodne buty"
                        value={currentRequirement}
                        onChange={(e) => setCurrentRequirement(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addRequirement();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addRequirement}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {requirements.map((req, idx) => (
                        <Badge key={idx} variant="secondary">
                          {req}
                          <X
                            className="w-3 h-3 ml-1 cursor-pointer"
                            onClick={() => removeRequirement(req)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </FormControl>

                <FormControl label="Tagi">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="np. początkujący"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addTag}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">
                          #{tag}
                          <X
                            className="w-3 h-3 ml-1 cursor-pointer"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </FormControl>

                <FormControl
                  label="Widoczność"
                  htmlFor="visibility"
                >
                  <Select
                    value={watch("visibility")}
                    onValueChange={(value) => setValue("visibility", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Publiczne</SelectItem>
                      <SelectItem value="private">Prywatne</SelectItem>
                      <SelectItem value="students_only">Tylko dla uczniów</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </div>
        </GridBox>

        <FormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => list("events")}
          >
            Anuluj
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Tworzenie..." : "Utwórz wydarzenie"}
          </Button>
        </FormActions>
      </Form>
    </>
  );
};