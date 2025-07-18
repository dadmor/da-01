// src/pages/dancers/edit.tsx
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

const experienceLevels = ["Początkujący", "Średniozaawansowany", "Zaawansowany", "Profesjonalny"];
const lookingForOptions = ["Partner do tańca", "Szkoła tańca", "Wydarzenia", "Wszystko"];
const danceStyles = ["Salsa", "Bachata", "Tango", "Walc", "Cha-cha", "Rumba", "Samba", "Jazz", "Hip-hop", "Balet"];

export const DancersEdit = () => {
  const { list, show } = useNavigation();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

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
        age: record.age,
        city: record.city,
        experience_level: record.experience_level,
        looking_for: record.looking_for,
        bio: record.bio,
        dance_styles: record.dance_styles || [],
      });
      setSelectedStyles(record.dance_styles || []);
      if (record.photo_url) {
        setPhotoPreview(record.photo_url);
      }
    }
  }, [record, reset]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { data, error } = await supabaseClient.storage
      .from('dancer-photos')
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabaseClient.storage
      .from('dancer-photos')
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
      let photoUrl = record.photo_url;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }
      
      await onFinish({
        ...data,
        photo_url: photoUrl,
        dance_styles: selectedStyles,
      });
    } catch (error) {
      console.error("Error updating dancer:", error);
    }
  };

  if (init) return init;

  if (!record) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Profil nie znaleziony</p>
          <Button className="mt-4" onClick={() => list("dancers")}>
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
        onClick={() => show("dancers", record.id!)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Powrót do profilu
      </Button>

      <FlexBox>
        <Lead
          title="Edytuj profil"
          description={`Aktualizuj swoje dane • ID: #${String(record.id).slice(0, 8)}`}
        />
      </FlexBox>

      <Card>
        <CardHeader>
          <CardTitle>Informacje podstawowe</CardTitle>
        </CardHeader>
        <CardContent>
          <Form onSubmit={handleSubmit(handleFormSubmit)}>
            <GridBox variant="1-2-2">
              <FormControl
                label="Imię i nazwisko"
                htmlFor="name"
                error={errors.name?.message as string}
                required
              >
                <Input
                  id="name"
                  placeholder="Jan Kowalski"
                  {...register("name", {
                    required: "Imię jest wymagane",
                  })}
                />
              </FormControl>

              <FormControl
                label="Wiek"
                htmlFor="age"
                error={errors.age?.message as string}
                required
              >
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  {...register("age", {
                    required: "Wiek jest wymagany",
                    min: { value: 18, message: "Musisz mieć minimum 18 lat" },
                    max: { value: 100, message: "Nieprawidłowy wiek" },
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
                label="Poziom doświadczenia"
                error={errors.experience_level?.message as string}
                required
              >
                <Select
                  value={watch("experience_level")}
                  onValueChange={(value) => setValue("experience_level", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz poziom" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>

              <FormControl
                label="Czego szukasz?"
                error={errors.looking_for?.message as string}
                required
              >
                <Select
                  value={watch("looking_for")}
                  onValueChange={(value) => setValue("looking_for", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz opcję" />
                  </SelectTrigger>
                  <SelectContent>
                    {lookingForOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </GridBox>

            <FormControl
              label="Zdjęcie profilowe"
              htmlFor="photo"
            >
              <div className="space-y-4">
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="cursor-pointer"
                />
                {photoPreview && (
                  <div className="relative w-32 h-32">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </FormControl>

            <FormControl
              label="O mnie"
              htmlFor="bio"
              error={errors.bio?.message as string}
              required
            >
              <Textarea
                id="bio"
                placeholder="Opowiedz coś o sobie..."
                rows={4}
                {...register("bio", {
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
                onClick={() => show("dancers", record.id!)}
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