// src/pages/outdoor-events/edit.tsx
import { useForm } from "@refinedev/react-hook-form";
import { useNavigation } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Form, FormActions, FormControl } from "@/components/form";
import { useState, useEffect } from "react";
import { useLoading } from "@/utility";
import { supabaseClient } from "@/utility";

const eventTypes = ["Milonga", "Potańcówka", "Festiwal", "Warsztaty plenerowe", "Flashmob", "Inne"];
const danceStyles = ["Salsa", "Bachata", "Tango", "Swing", "Kizomba", "Mix", "Inne"];

export const OutdoorEventsEdit = () => {
  const { list, show } = useNavigation();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");

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
        event_type: record.event_type,
        event_date: record.event_date,
        time: record.time,
        city: record.city,
        location: record.location,
        price: record.price || 0,
        event_link: record.event_link,
        description: record.description,
        requirements: record.requirements,
        dance_styles: record.dance_styles || [],
      });
      setSelectedStyles(record.dance_styles || []);
      if (record.cover_image) {
        setCoverPreview(record.cover_image);
      }
    }
  }, [record, reset]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadCover = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { data, error } = await supabaseClient.storage
      .from('event-covers')
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabaseClient.storage
      .from('event-covers')
      .getPublicUrl(fileName);
      
    return publicUrl;
  };

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
      let coverImage = record.cover_image;
      if (coverFile) {
        coverImage = await uploadCover(coverFile);
      }
      
      await onFinish({
        ...data,
        cover_image: coverImage,
        dance_styles: selectedStyles,
        price: data.price ? parseFloat(data.price) : 0,
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
          <Button className="mt-4" onClick={() => list("outdoor_events")}>
            Powrót do listy
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => show("outdoor_events", record.id!)}
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
                  placeholder="Tango pod gwiazdami"
                  {...register("name", {
                    required: "Nazwa jest wymagana",
                  })}
                />
              </FormControl>

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
                    {eventTypes.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
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
                label="Godzina"
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
                label="Miasto"
                htmlFor="city"
                error={errors.city?.message as string}
                required
              >
                <Input
                  id="city"
                  placeholder="Warszawa"
                  {...register("city", {
                    required: "Miasto jest wymagane",
                  })}
                />
              </FormControl>

              <FormControl
                label="Lokalizacja"
                htmlFor="location"
                error={errors.location?.message as string}
                required
              >
                <Input
                  id="location"
                  placeholder="Park Łazienkowski"
                  {...register("location", {
                    required: "Lokalizacja jest wymagana",
                  })}
                />
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
                label="Link do wydarzenia"
                htmlFor="event_link"
                error={errors.event_link?.message as string}
              >
                <Input
                  id="event_link"
                  type="url"
                  placeholder="https://facebook.com/event/..."
                  {...register("event_link")}
                />
              </FormControl>
            </GridBox>

            <FormControl
              label="Zdjęcie wydarzenia"
              htmlFor="cover"
            >
              <div className="space-y-4">
                <Input
                  id="cover"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="cursor-pointer"
                />
                {coverPreview && (
                  <div className="relative w-full max-w-md h-48">
                    <img
                      src={coverPreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </FormControl>

            <FormControl
              label="Opis wydarzenia"
              htmlFor="description"
              error={errors.description?.message as string}
              required
            >
              <Textarea
                id="description"
                placeholder="Opisz wydarzenie..."
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

            <FormControl
              label="Informacje organizacyjne"
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
                onClick={() => show("outdoor_events", record.id!)}
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