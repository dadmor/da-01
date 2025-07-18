// src/pages/school-events/edit.tsx
import { useForm } from "@refinedev/react-hook-form";
import { useNavigation, useList } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Form, FormActions, FormControl } from "@/components/form";
import { useState, useEffect } from "react";
import { useLoading } from "@/utility";

const eventTypes = [
  { value: "workshop", label: "Warsztaty" },
  { value: "party", label: "Impreza" },
  { value: "course", label: "Kurs" },
  { value: "bootcamp", label: "Bootcamp" },
];

const danceStyles = ["Salsa", "Bachata", "Tango", "Walc", "Cha-cha", "Rumba", "Samba", "Jazz", "Hip-hop", "Balet"];
const skillLevels = ["Początkujący", "Średniozaawansowany", "Zaawansowany", "Wszystkie poziomy"];

export const SchoolEventsEdit = () => {
  const { list, show } = useNavigation();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  // Fetch schools for dropdown
  const { data: schoolsData } = useList({
    resource: "dance_schools",
    pagination: { mode: "off" },
  });

  const {
    refineCore: { onFinish, queryResult },
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const data = queryResult?.data;
  const isLoading = queryResult?.isLoading ?? false;
  const isError = queryResult?.isError ?? false;
  const record = data?.data;
  const init = useLoading({ isLoading, isError });

  useEffect(() => {
    if (record) {
      reset({
        name: record.name,
        school_id: record.school_id,
        type: record.type,
        event_date: record.event_date,
        time: record.time,
        duration: record.duration,
        skill_level: record.skill_level,
        price: record.price || 0,
        max_participants: record.max_participants,
        instructor: record.instructor,
        description: record.description,
        dance_styles: record.dance_styles || [],
        program: record.program,
        course_sessions: record.course_sessions,
        course_schedule: record.course_schedule,
        requirements: record.requirements,
      });
      setSelectedStyles(record.dance_styles || []);
    }
  }, [record, reset]);

  const handleStyleToggle = (style: string) => {
    setSelectedStyles(prev => {
      const newStyles = prev.includes(style)
        ? prev.filter(s => s !== style)
        : [...prev, style];
      setValue("dance_styles", newStyles);
      return newStyles;
    });
  };

  const handleFormSubmit = async (data: any) => {
    try {
      await onFinish({
        ...data,
        dance_styles: selectedStyles,
        price: data.price ? parseFloat(data.price) : 0,
        max_participants: data.max_participants ? parseInt(data.max_participants) : null,
      });
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  if (init) return init;

  if (!record) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Wydarzenie nie znalezione</p>
          <Button className="mt-4" onClick={() => list("school_events")}>
            Powrót do listy
          </Button>
        </div>
      </div>
    );
  }

  const schools = schoolsData?.data || [];
  const eventType = watch("type");

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => show("school_events", record.id!)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Powrót do szczegółów
      </Button>

      <FlexBox>
        <Lead
          title="Edytuj wydarzenie"
          description={`Aktualizuj dane wydarzenia • ID: #${String(record.id).slice(0, 8)}`}
        />
      </FlexBox>

      <Card>
        <CardHeader>
          <CardTitle>Informacje o wydarzeniu</CardTitle>
        </CardHeader>
        <CardContent>
          <Form onSubmit={handleSubmit(handleFormSubmit)}>
            <GridBox variant="1-2-2">
              <FormControl
                label="Nazwa wydarzenia"
                htmlFor="name"
                error={errors.name?.message as string}
                required
              >
                <Input
                  id="name"
                  placeholder="Warsztaty Salsy dla początkujących"
                  {...register("name", {
                    required: "Nazwa jest wymagana",
                  })}
                />
              </FormControl>

              <FormControl
                label="Szkoła organizująca"
                error={errors.school_id?.message as string}
                required
              >
                <Select
                  value={watch("school_id")}
                  onValueChange={(value) => setValue("school_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz szkołę" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school: any) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name} - {school.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>

              <FormControl
                label="Typ wydarzenia"
                error={errors.type?.message as string}
                required
              >
                <Select
                  value={watch("type")}
                  onValueChange={(value) => setValue("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz typ" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>

              <FormControl
                label="Data wydarzenia"
                htmlFor="event_date"
                error={errors.event_date?.message as string}
                required
              >
                <Input
                  id="event_date"
                  type="date"
                  {...register("event_date", {
                    required: "Data jest wymagana",
                  })}
                />
              </FormControl>

              <FormControl
                label="Godzina rozpoczęcia"
                htmlFor="time"
                error={errors.time?.message as string}
                required
              >
                <Input
                  id="time"
                  type="time"
                  {...register("time", {
                    required: "Godzina jest wymagana",
                  })}
                />
              </FormControl>

              <FormControl
                label="Czas trwania"
                htmlFor="duration"
                error={errors.duration?.message as string}
              >
                <Input
                  id="duration"
                  placeholder="np. 2 godziny, 90 minut"
                  {...register("duration")}
                />
              </FormControl>

              <FormControl
                label="Poziom zaawansowania"
                error={errors.skill_level?.message as string}
                required
              >
                <Select
                  value={watch("skill_level")}
                  onValueChange={(value) => setValue("skill_level", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz poziom" />
                  </SelectTrigger>
                  <SelectContent>
                    {skillLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>

              <FormControl
                label="Cena (PLN)"
                htmlFor="price"
                error={errors.price?.message as string}
              >
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0 (bezpłatne)"
                  {...register("price", {
                    min: { value: 0, message: "Cena nie może być ujemna" },
                  })}
                />
              </FormControl>

              <FormControl
                label="Maks. liczba uczestników"
                htmlFor="max_participants"
                error={errors.max_participants?.message as string}
              >
                <Input
                  id="max_participants"
                  type="number"
                  min="1"
                  placeholder="Brak limitu"
                  {...register("max_participants", {
                    min: { value: 1, message: "Minimalna liczba to 1" },
                  })}
                />
              </FormControl>

              <FormControl
                label="Instruktor"
                htmlFor="instructor"
                error={errors.instructor?.message as string}
              >
                <Input
                  id="instructor"
                  placeholder="Imię i nazwisko instruktora"
                  {...register("instructor")}
                />
              </FormControl>
            </GridBox>

            <FormControl
              label="Opis wydarzenia"
              htmlFor="description"
              error={errors.description?.message as string}
              required
            >
              <Textarea
                id="description"
                placeholder="Opisz czego uczestnicy się nauczą..."
                rows={4}
                {...register("description", {
                  required: "Opis jest wymagany",
                  minLength: {
                    value: 50,
                    message: "Opis musi mieć minimum 50 znaków",
                  },
                })}
              />
            </FormControl>

            <FormControl
              label="Style tańca"
              error={selectedStyles.length === 0 ? "Wybierz przynajmniej jeden styl" : undefined}
              required
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {danceStyles.map((style) => (
                  <Button
                    key={style}
                    type="button"
                    variant={selectedStyles.includes(style) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStyleToggle(style)}
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </FormControl>

            {eventType === "workshop" && (
              <FormControl
                label="Program warsztatów"
                htmlFor="program"
                error={errors.program?.message as string}
              >
                <Textarea
                  id="program"
                  placeholder="Plan warsztatów..."
                  rows={3}
                  {...register("program")}
                />
              </FormControl>
            )}

            {eventType === "course" && (
              <>
                <FormControl
                  label="Liczba zajęć"
                  htmlFor="course_sessions"
                  error={errors.course_sessions?.message as string}
                >
                  <Input
                    id="course_sessions"
                    type="number"
                    min="1"
                    placeholder="np. 8"
                    {...register("course_sessions")}
                  />
                </FormControl>

                <FormControl
                  label="Harmonogram kursu"
                  htmlFor="course_schedule"
                  error={errors.course_schedule?.message as string}
                >
                  <Textarea
                    id="course_schedule"
                    placeholder="np. Każdy czwartek o 19:00"
                    rows={2}
                    {...register("course_schedule")}
                  />
                </FormControl>
              </>
            )}

            <FormControl
              label="Wymagania"
              htmlFor="requirements"
              error={errors.requirements?.message as string}
            >
              <Textarea
                id="requirements"
                placeholder="Co uczestnicy powinni ze sobą zabrać..."
                rows={3}
                {...register("requirements")}
              />
            </FormControl>

            {record.created_at && (
              <FlexBox variant="end" className="text-xs text-muted-foreground">
                <div>
                  <span>Utworzono: </span>
                  {new Date(record.created_at).toLocaleDateString("pl-PL")}
                </div>
                {record.updated_at && (
                  <div>
                    <span>Ostatnia aktualizacja: </span>
                    {new Date(record.updated_at).toLocaleDateString("pl-PL")}
                  </div>
                )}
              </FlexBox>
            )}

            <FormActions>
              <Button
                type="button"
                variant="outline"
                onClick={() => show("school_events", record.id!)}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || selectedStyles.length === 0}
              >
                {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
              </Button>
            </FormActions>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};