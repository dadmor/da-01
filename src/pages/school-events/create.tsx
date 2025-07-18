// src/pages/school-events/create.tsx
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
import { useState } from "react";

const eventTypes = [
  { value: "workshop", label: "Warsztaty" },
  { value: "party", label: "Impreza" },
  { value: "course", label: "Kurs" },
  { value: "bootcamp", label: "Bootcamp" },
];

const danceStyles = ["Salsa", "Bachata", "Tango", "Walc", "Cha-cha", "Rumba", "Samba", "Jazz", "Hip-hop", "Balet"];
const skillLevels = ["Początkujący", "Średniozaawansowany", "Zaawansowany", "Wszystkie poziomy"];

export const SchoolEventsCreate = () => {
  const { list } = useNavigation();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  // Fetch schools for dropdown
  const { data: schoolsData } = useList({
    resource: "dance_schools",
    pagination: { mode: "off" },
  });

  const {
    refineCore: { onFinish },
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

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
      console.error("Error creating event:", error);
    }
  };

  const schools = schoolsData?.data || [];
  const eventType = watch("type");

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => list("school_events")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Powrót do listy
      </Button>

      <FlexBox>
        <Lead
          title="Dodaj wydarzenie szkoły"
          description="Utwórz nowe wydarzenie dla szkoły tańca"
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
                  onValueChange={(value) => setValue("school_id", value)}
                  {...register("school_id", {
                    required: "Szkoła jest wymagana",
                  })}
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
                  onValueChange={(value) => setValue("type", value)}
                  {...register("type", {
                    required: "Typ wydarzenia jest wymagany",
                  })}
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
                    validate: (value) => {
                      const selectedDate = new Date(value);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return selectedDate >= today || "Data nie może być z przeszłości";
                    },
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
                  onValueChange={(value) => setValue("skill_level", value)}
                  {...register("skill_level", {
                    required: "Poziom jest wymagany",
                  })}
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
                placeholder="Opisz czego uczestnicy się nauczą, jak będzie wyglądało wydarzenie..."
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
                  placeholder="Plan warsztatów, co będzie omawiane..."
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
                placeholder="Co uczestnicy powinni ze sobą zabrać, wymagania wstępne..."
                rows={3}
                {...register("requirements")}
              />
            </FormControl>

            <FormActions>
              <Button
                type="button"
                variant="outline"
                onClick={() => list("school_events")}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || selectedStyles.length === 0}
              >
                {isSubmitting ? "Tworzenie..." : "Utwórz wydarzenie"}
              </Button>
            </FormActions>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};