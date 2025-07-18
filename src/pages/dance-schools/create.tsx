// src/pages/dance-schools/create.tsx
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
import { useState } from "react";
import { supabaseClient } from "@/utility";

const priceRanges = ["$", "$$", "$$$", "$$$$"];
const danceStyles = ["Salsa", "Bachata", "Tango", "Walc", "Cha-cha", "Rumba", "Samba", "Jazz", "Hip-hop", "Balet", "Modern", "Breakdance"];

export const DanceSchoolsCreate = () => {
  const { list } = useNavigation();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const {
    refineCore: { onFinish },
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

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
      let logoUrl = "";
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }
      
      await onFinish({
        ...data,
        logo_url: logoUrl,
        dance_styles: selectedStyles,
      });
    } catch (error) {
      console.error("Error creating school:", error);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => list("dance_schools")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Powrót do listy
      </Button>

      <FlexBox>
        <Lead
          title="Dodaj szkołę tańca"
          description="Zarejestruj swoją szkołę tańca na platformie"
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
                  onValueChange={(value) => setValue("price_range", value)}
                  {...register("price_range", {
                    required: "Przedział cenowy jest wymagany",
                  })}
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
                placeholder="Opisz swoją szkołę, metodykę nauczania, atmosferę..."
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

            <FormActions>
              <Button
                type="button"
                variant="outline"
                onClick={() => list("dance_schools")}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || selectedStyles.length === 0}
              >
                {isSubmitting ? "Dodawanie..." : "Dodaj szkołę"}
              </Button>
            </FormActions>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};