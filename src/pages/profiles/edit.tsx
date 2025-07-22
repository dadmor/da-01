// ------ src/pages/profiles/edit.tsx ------
import { useForm } from "@refinedev/react-hook-form";
import { useGetIdentity, useUpdate } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Input, Textarea, Switch } from "@/components/ui";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Form, FormActions, FormControl } from "@/components/form";
import { SubPage } from "@/components/layout";
import { supabaseClient } from "@/utility/supabaseClient";

interface UserRecord {
  id: string;
  email: string;
  name: string;
  bio?: string;
  profile_photo_url?: string;
  birth_date?: string;
  height?: number;
  location_lat?: number;
  location_lng?: number;
  city?: string;
  search_radius_km?: number;
  is_trainer?: boolean;
  is_school_owner?: boolean;
  is_verified?: boolean;
  is_active?: boolean;
  is_banned?: boolean;
  show_age?: boolean;
  show_exact_location?: boolean;
  visibility?: string;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
}

export const ProfileEdit = () => {
  const { data: identity, isLoading: isLoadingIdentity } = useGetIdentity<any>();
  const [userData, setUserData] = useState<UserRecord | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: updateUser } = useUpdate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Pobierz dane użytkownika
  useEffect(() => {
    if (identity?.id) {
      setIsLoadingUser(true);
      setError(null);
      
      supabaseClient
        .from('users')
        .select('*')
        .eq('id', identity.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching user:', error);
            setError('Nie udało się pobrać danych użytkownika');
          } else if (data) {
            setUserData(data);
            reset(data);
          }
          setIsLoadingUser(false);
        });
    }
  }, [identity?.id, reset]);

  const onFinish = (values: any) => {
    if (!identity?.id) return;

    updateUser(
      {
        resource: "users",
        id: identity.id,
        values,
      },
      {
        onSuccess: () => {
          // Możesz dodać toast lub przekierowanie
          console.log("Profil zaktualizowany pomyślnie");
        },
        onError: (error) => {
          console.error("Błąd aktualizacji profilu:", error);
        },
      }
    );
  };

  // Obsługa stanów ładowania
  if (isLoadingIdentity) {
    return (
      <SubPage>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Ładowanie danych użytkownika...</p>
          </div>
        </div>
      </SubPage>
    );
  }

  if (!identity?.id) {
    return (
      <SubPage>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 text-lg">Nie można załadować danych użytkownika</p>
            <p className="text-muted-foreground mt-2">Spróbuj odświeżyć stronę</p>
          </div>
        </div>
      </SubPage>
    );
  }

  if (isLoadingUser) {
    return (
      <SubPage>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Ładowanie profilu...</p>
          </div>
        </div>
      </SubPage>
    );
  }

  if (error) {
    return (
      <SubPage>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 text-lg">{error}</p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              Odśwież stronę
            </Button>
          </div>
        </div>
      </SubPage>
    );
  }

  return (
    <SubPage>
      <FlexBox>
        <Lead
          title="Mój Profil"
          description="Zarządzaj swoimi danymi i preferencjami"
        />
      </FlexBox>

      <Form onSubmit={handleSubmit(onFinish)}>
        <GridBox variant="1-1-1">
          {/* Dane podstawowe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Dane podstawowe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GridBox variant="1-2-2">
                <FormControl
                  label="Imię i nazwisko"
                  htmlFor="name"
                  error={errors.name?.message as string}
                  required
                >
                  <Input
                    id="name"
                    {...register("name", {
                      required: "Imię jest wymagane",
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
                    {...register("email", {
                      required: "Email jest wymagany",
                    })}
                    disabled
                  />
                </FormControl>

                <FormControl
                  label="Data urodzenia"
                  htmlFor="birth_date"
                  error={errors.birth_date?.message as string}
                >
                  <Input
                    id="birth_date"
                    type="date"
                    {...register("birth_date")}
                  />
                </FormControl>

                <FormControl
                  label="Wzrost (cm)"
                  htmlFor="height"
                  error={errors.height?.message as string}
                >
                  <Input
                    id="height"
                    type="number"
                    min="100"
                    max="250"
                    {...register("height", {
                      min: { value: 100, message: "Minimalny wzrost to 100cm" },
                      max: { value: 250, message: "Maksymalny wzrost to 250cm" },
                      valueAsNumber: true,
                    })}
                  />
                </FormControl>
              </GridBox>

              <FormControl
                label="O mnie"
                htmlFor="bio"
                error={errors.bio?.message as string}
              >
                <Textarea
                  id="bio"
                  rows={4}
                  placeholder="Opowiedz coś o sobie..."
                  {...register("bio", {
                    maxLength: {
                      value: 500,
                      message: "Maksymalnie 500 znaków",
                    },
                  })}
                />
              </FormControl>

              <GridBox variant="1-2-2">
                <FormControl label="Jestem trenerem">
                  <FlexBox variant="start">
                    <Switch
                      checked={watch("is_trainer") || false}
                      onCheckedChange={(checked) => setValue("is_trainer", checked)}
                    />
                    <span className="text-sm text-muted-foreground">
                      Zaznacz jeśli prowadzisz zajęcia taneczne
                    </span>
                  </FlexBox>
                </FormControl>

                <FormControl label="Posiadam szkołę tańca">
                  <FlexBox variant="start">
                    <Switch
                      checked={watch("is_school_owner") || false}
                      onCheckedChange={(checked) => setValue("is_school_owner", checked)}
                    />
                    <span className="text-sm text-muted-foreground">
                      Zaznacz jeśli prowadzisz szkołę tańca
                    </span>
                  </FlexBox>
                </FormControl>
              </GridBox>
            </CardContent>
          </Card>

          {/* Lokalizacja i prywatność */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Lokalizacja i prywatność
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GridBox variant="1-2-2">
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

                <FormControl
                  label="Promień wyszukiwania (km)"
                  htmlFor="search_radius_km"
                  error={errors.search_radius_km?.message as string}
                >
                  <Input
                    id="search_radius_km"
                    type="number"
                    min="5"
                    max="200"
                    defaultValue={50}
                    {...register("search_radius_km", {
                      min: { value: 5, message: "Minimum 5km" },
                      max: { value: 200, message: "Maksimum 200km" },
                      valueAsNumber: true,
                    })}
                  />
                </FormControl>

                <FormControl
                  label="Widoczność profilu"
                  error={errors.visibility?.message as string}
                >
                  <Select
                    value={watch("visibility") || "public"}
                    onValueChange={(value) => setValue("visibility", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz widoczność" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Publiczny</SelectItem>
                      <SelectItem value="friends">Tylko znajomi</SelectItem>
                      <SelectItem value="private">Prywatny</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </GridBox>

              <GridBox variant="1-2-2">
                <FormControl label="Pokaż wiek">
                  <FlexBox variant="start">
                    <Switch
                      checked={watch("show_age") !== false}
                      onCheckedChange={(checked) => setValue("show_age", checked)}
                    />
                    <span className="text-sm text-muted-foreground">
                      Twój wiek będzie widoczny w profilu
                    </span>
                  </FlexBox>
                </FormControl>

                <FormControl label="Pokaż dokładną lokalizację">
                  <FlexBox variant="start">
                    <Switch
                      checked={watch("show_exact_location") || false}
                      onCheckedChange={(checked) => setValue("show_exact_location", checked)}
                    />
                    <span className="text-sm text-muted-foreground">
                      Pokazuj dokładną lokalizację zamiast tylko miasta
                    </span>
                  </FlexBox>
                </FormControl>
              </GridBox>
            </CardContent>
          </Card>
        </GridBox>

        <FormActions>
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