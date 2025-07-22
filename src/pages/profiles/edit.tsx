// ------ src/pages/profiles/edit.tsx ------
import { useForm } from "@refinedev/react-hook-form";
import { useGetIdentity, useOne } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, MapPin } from "lucide-react";
import { useEffect } from "react";
import { Button, Input, Textarea, Switch } from "@/components/ui";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Form, FormActions, FormControl } from "@/components/form";
import { useLoading } from "@/utility";
import { SubPage } from "@/components/layout";

export const ProfileEdit = () => {
  const { data: identity } = useGetIdentity();

  const {
    refineCore: { onFinish },
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resource: "users",
    id: identity?.id,
    action: "edit",
    queryOptions: {
      enabled: !!identity?.id,
    },
    refineCoreProps: {
      queryOptions: {
        enabled: !!identity?.id,
      },
    },
  });

  const { data, isLoading, isError } = useOne({
    resource: "users", 
    id: identity?.id || "",
    queryOptions: {
      enabled: !!identity?.id,
    },
  });

  const record = data?.data;
  const init = useLoading({ isLoading, isError });

  useEffect(() => {
    if (record) {
      reset(record);
    }
  }, [record, reset]);

  if (!identity?.id) return <div>Ładowanie danych użytkownika...</div>;
  if (init) return init;

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
                      checked={watch("is_trainer")}
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
                      checked={watch("is_school_owner")}
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
                    {...register("search_radius_km", {
                      min: { value: 5, message: "Minimum 5km" },
                      max: { value: 200, message: "Maksimum 200km" },
                    })}
                  />
                </FormControl>

                <FormControl
                  label="Widoczność profilu"
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
                      checked={watch("show_age")}
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
                      checked={watch("show_exact_location")}
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