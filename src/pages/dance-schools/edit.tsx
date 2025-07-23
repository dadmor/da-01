// src/pages/dance-schools/edit.tsx
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

const priceRanges = ["$", "$$", "$$$", "$$$$"];
const danceStyles = ["Salsa", "Bachata", "Tango", "Walc", "Cha-cha", "Rumba", "Samba", "Jazz", "Hip-hop", "Balet", "Modern", "Breakdance"];

export const DanceSchoolsEdit = () => {
  const { list, show } = useNavigation();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

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
        city: record.city,
        address: record.address,
        phone: record.phone,
        email: record.email,
        website: record.website,
        price_range: record.price_range,
        description: record.description,
        dance_styles: record.dance_styles || [],
      });
      setSelectedStyles(record.dance_styles || []);
      if (record.logo_url) {
        setLogoPreview(record.logo_url);
      }
    }
  }, [record, reset]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { data, error } = await supabaseClient.storage
      .from('school-logos')
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabaseClient.storage
      .from('school-logos')
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
      let logoUrl = record?.logo_url;
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }
      
      await onFinish({
        ...data,
        logo_url: logoUrl,
        dance_styles: selectedStyles,
      });
    } catch (error) {
      console.error("Error updating school:", error);
    }
  };

  if (init) return init;

  if (!record) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Szkoła nie znaleziona</p>
          <Button className="mt-4" onClick={() => list("dance_schools")}>
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
        onClick={() => show("dance_schools", record.id!)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Powrót do szczegółów
      </Button>

      <FlexBox>
        <Lead
          title="Edytuj szkołę"
          description={`Aktualizuj dane szkoły • ID: #${String(record.id).slice(0, 8)}`}
        />
      </FlexBox>

      <Card>
        <CardHeader>
          <CardTitle>Informacje o szkole</CardTitle>
        </CardHeader>
        <CardContent>
          <Form onSubmit={handleSubmit(handleFormSubmit)}>
            <GridBox variant="1-2-2">
              <FormControl
                label="Nazwa szkoły"
                htmlFor="name"
                error={errors.name?.message as string}
                required
              >
                <Input
                  id="name"
                  placeholder="Dance Academy"
                  {...register("name", {
                    required: "Nazwa jest wymagana",
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
                label="Adres"
                htmlFor="address"
                error={errors.address?.message as string}
                required
              >
                <Input
                  id="address"
                  placeholder="ul. Taneczna 10"
                  {...register("address", {
                    required: "Adres jest wymagany",
                  })}
                />
              </FormControl>

              <FormControl
                label="Telefon"
                htmlFor="phone"
                error={errors.phone?.message as string}
                required
              >
                <Input
                  id="phone"
                  placeholder="+48 123 456 789"
                  {...register("phone", {
                    required: "Telefon jest wymagany",
                  })}
                />
              </FormControl>

              <FormControl
                label="Email"
                htmlFor="email"
                error={errors.email?.message as string}
                required
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="kontakt@szkola.pl"
                  {...register("email", {
                    required: "Email jest wymagany",
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: "Nieprawidłowy format email",
                    },
                  })}
                />
              </FormControl>

              <FormControl
                label="Strona internetowa"
                htmlFor="website"
                error={errors.website?.message as string}
              >
                <Input
                  id="website"
                  type="url"
                  placeholder="https://szkola.pl"
                  {...register("website")}
                />
              </FormControl>

              <FormControl
                label="Przedział cenowy"
                error={errors.price_range?.message as string}
                required
              >
                <Select
                  value={watch("price_range")}
                  onValueChange={(value) => setValue("price_range", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz przedział" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceRanges.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </GridBox>

            <FormControl
              label="Logo szkoły"
              htmlFor="logo"
            >
              <div className="space-y-4">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="cursor-pointer"
                />
                {logoPreview && (
                  <div className="relative w-48 h-48">
                    <img
                      src={logoPreview}
                      alt="Preview"
                      className="w-full h-full object-contain rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </FormControl>

            <FormControl
              label="Opis szkoły"
              htmlFor="description"
              error={errors.description?.message as string}
              required
            >
              <Textarea
                id="description"
                placeholder="Opisz swoją szkołę..."
                rows={4}
                {...register("description", {
                  required: "Opis jest wymagany",
                  minLength: {
                    value: 100,
                    message: "Opis musi mieć minimum 100 znaków",
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
                onClick={() => show("dance_schools", record.id!)}
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