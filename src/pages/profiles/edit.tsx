// ------ src/pages/profiles/edit.tsx ------
import { useForm } from "@refinedev/react-hook-form";
import { useGetIdentity, useUpdate } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, MapPin, Camera, X, Music, Plus, Trash2, GraduationCap } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Button, Input, Textarea, Switch } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Form, FormActions, FormControl } from "@/components/form";
import { SubPage } from "@/components/layout";
import { supabaseClient } from "@/utility/supabaseClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRecord, DanceStyle, UserDanceStyle } from "./interface";



export const ProfileEdit = () => {
  const { data: identity, isLoading: isLoadingIdentity } = useGetIdentity<any>();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserRecord | null>(null);
  const [userDanceStyles, setUserDanceStyles] = useState<UserDanceStyle[]>([]);
  const [availableDanceStyles, setAvailableDanceStyles] = useState<DanceStyle[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showAddDanceStyle, setShowAddDanceStyle] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      
      // Pobierz dane użytkownika
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
            if (data.profile_photo_url) {
              setPhotoPreview(data.profile_photo_url);
            }
          }
        });

      // Pobierz style tańca użytkownika
      supabaseClient
        .from('user_dance_styles')
        .select(`
          *,
          dance_style:dance_styles(*)
        `)
        .eq('user_id', identity.id)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching user dance styles:', error);
          } else if (data) {
            setUserDanceStyles(data);
          }
          setIsLoadingUser(false);
        });

      // Pobierz dostępne style tańca
      supabaseClient
        .from('dance_styles')
        .select('*')
        .eq('is_active', true)
        .order('name')
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching dance styles:', error);
          } else if (data) {
            setAvailableDanceStyles(data);
          }
        });
    }
  }, [identity?.id, reset]);

  // Funkcja do przesyłania zdjęcia
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !identity?.id) return;

    // Walidacja rozmiaru pliku (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Plik jest za duży. Maksymalny rozmiar to 5MB.');
      return;
    }

    // Walidacja typu pliku
    if (!file.type.startsWith('image/')) {
      alert('Proszę wybrać plik graficzny.');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      // Usuń stare zdjęcie jeśli istnieje
      if (userData?.profile_photo_url) {
        const oldPhotoPath = userData.profile_photo_url.split('/').pop();
        if (oldPhotoPath) {
          await supabaseClient.storage
            .from('profile-photos')
            .remove([`${identity.id}/${oldPhotoPath}`]);
        }
      }

      // Generuj unikalną nazwę pliku
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${identity.id}/${fileName}`;

      // Prześlij nowe zdjęcie
      const { error: uploadError, data } = await supabaseClient.storage
        .from('profile-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Pobierz publiczny URL
      const { data: { publicUrl } } = supabaseClient.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      // Ustaw podgląd
      setPhotoPreview(publicUrl);
      setValue('profile_photo_url', publicUrl);

      // Zaktualizuj w bazie danych od razu
      const { error: updateError } = await supabaseClient
        .from('users')
        .update({ profile_photo_url: publicUrl })
        .eq('id', identity.id);

      if (updateError) {
        throw updateError;
      }

    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Nie udało się przesłać zdjęcia. Spróbuj ponownie.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Funkcja do usuwania zdjęcia
  const handlePhotoRemove = async () => {
    if (!identity?.id || !userData?.profile_photo_url) return;

    if (!confirm('Czy na pewno chcesz usunąć zdjęcie profilowe?')) return;

    setIsUploadingPhoto(true);

    try {
      // Usuń z storage
      const photoPath = userData.profile_photo_url.split('/').pop();
      if (photoPath) {
        await supabaseClient.storage
          .from('profile-photos')
          .remove([`${identity.id}/${photoPath}`]);
      }

      // Zaktualizuj w bazie danych
      const { error } = await supabaseClient
        .from('users')
        .update({ profile_photo_url: null })
        .eq('id', identity.id);

      if (error) throw error;

      // Wyczyść podgląd
      setPhotoPreview(null);
      setValue('profile_photo_url', null);

    } catch (error) {
      console.error('Error removing photo:', error);
      alert('Nie udało się usunąć zdjęcia. Spróbuj ponownie.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Funkcja do dodawania stylu tańca
  const handleAddDanceStyle = async () => {
    if (!identity?.id) return;

    const danceStyleId = watch("new_dance_style_id");
    const skillLevel = watch("new_skill_level");
    const yearsExperience = watch("new_years_experience");
    const isTeaching = watch("new_is_teaching");

    if (!danceStyleId || !skillLevel) return;

    try {
      const { data, error } = await supabaseClient
        .from('user_dance_styles')
        .insert({
          user_id: identity.id,
          dance_style_id: danceStyleId,
          skill_level: skillLevel,
          years_experience: yearsExperience || null,
          is_teaching: isTeaching || false
        })
        .select(`
          *,
          dance_style:dance_styles(*)
        `)
        .single();

      if (error) throw error;

      if (data) {
        setUserDanceStyles([...userDanceStyles, data]);
        setShowAddDanceStyle(false);
        setValue("new_dance_style_id", "");
        setValue("new_skill_level", "");
        setValue("new_years_experience", "");
        setValue("new_is_teaching", false);
      }
    } catch (error) {
      console.error('Error adding dance style:', error);
      alert('Nie udało się dodać stylu tańca. Spróbuj ponownie.');
    }
  };

  // Funkcja do usuwania stylu tańca
  const handleRemoveDanceStyle = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten styl tańca?')) return;

    try {
      const { error } = await supabaseClient
        .from('user_dance_styles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUserDanceStyles(userDanceStyles.filter(uds => uds.id !== id));
    } catch (error) {
      console.error('Error removing dance style:', error);
      alert('Nie udało się usunąć stylu tańca. Spróbuj ponownie.');
    }
  };

  const onFinish = (values: any) => {
    if (!identity?.id) return;

    // Usuń pola związane z dodawaniem stylów tańca - nie są częścią tabeli users
    const { 
      new_dance_style_id, 
      new_skill_level, 
      new_years_experience, 
      new_is_teaching, 
      ...userValues 
    } = values;

    updateUser(
      {
        resource: "users",
        id: identity.id,
        values: userValues,
      },
      {
        onSuccess: () => {
          // Przekieruj do widoku profilu po zapisaniu
          navigate("/profiles/show");
        },
        onError: (error) => {
          console.error("Błąd aktualizacji profilu:", error);
          alert("Wystąpił błąd podczas zapisywania profilu. Spróbuj ponownie.");
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
              {/* Sekcja zdjęcia profilowego */}
              <div className="mb-6">
                <FormControl label="Zdjęcie profilowe">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={photoPreview || undefined} />
                      <AvatarFallback>
                        {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {isUploadingPhoto ? 'Przesyłanie...' : 'Zmień zdjęcie'}
                      </Button>
                      
                      {photoPreview && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handlePhotoRemove}
                          disabled={isUploadingPhoto}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Usuń
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Dozwolone formaty: JPG, PNG, GIF. Maksymalny rozmiar: 5MB
                  </p>
                </FormControl>
              </div>

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

          {/* Style tańca */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Style tańca
                </span>
                {userDanceStyles.length > 0 && (
                  <Badge variant="secondary">{userDanceStyles.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Lista stylów tańca */}
              {userDanceStyles.length > 0 && (
                <div className="space-y-3 mb-4">
                  {userDanceStyles.map((uds) => (
                    <div
                      key={uds.id}
                      className="p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">
                            {uds.dance_style?.name || 'Nieznany styl'}
                          </p>
                          {uds.dance_style?.category && (
                            <p className="text-xs text-muted-foreground capitalize">
                              {uds.dance_style.category}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDanceStyle(uds.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="capitalize">
                          {uds.skill_level}
                        </Badge>
                        {uds.is_teaching && (
                          <Badge variant="secondary" className="text-xs">
                            <GraduationCap className="w-3 h-3 mr-1" />
                            Uczę
                          </Badge>
                        )}
                        {uds.years_experience && (
                          <span className="text-sm text-muted-foreground">
                            • {uds.years_experience} {uds.years_experience === 1 ? 'rok' : uds.years_experience < 5 ? 'lata' : 'lat'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formularz dodawania nowego stylu */}
              {showAddDanceStyle ? (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                  <GridBox variant="1-2-2">
                    <FormControl label="Styl tańca" required>
                      <Select
                        value={watch("new_dance_style_id") || ""}
                        onValueChange={(value) => setValue("new_dance_style_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz styl" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDanceStyles
                            .filter(ds => !userDanceStyles.some(uds => uds.dance_style_id === ds.id))
                            .map(ds => (
                              <SelectItem key={ds.id} value={ds.id}>
                                {ds.name} {ds.category && `(${ds.category})`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormControl>

                    <FormControl label="Poziom zaawansowania" required>
                      <Select
                        value={watch("new_skill_level") || ""}
                        onValueChange={(value) => setValue("new_skill_level", value)}
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

                    <FormControl label="Lata doświadczenia">
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        {...register("new_years_experience", {
                          valueAsNumber: true,
                          min: 0,
                          max: 50
                        })}
                      />
                    </FormControl>

                    <FormControl label="Uczę tego stylu">
                      <FlexBox variant="start">
                        <Switch
                          checked={watch("new_is_teaching") || false}
                          onCheckedChange={(checked) => setValue("new_is_teaching", checked)}
                        />
                        <span className="text-sm text-muted-foreground">
                          Zaznacz jeśli uczysz tego stylu
                        </span>
                      </FlexBox>
                    </FormControl>
                  </GridBox>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddDanceStyle}
                      disabled={!watch("new_dance_style_id") || !watch("new_skill_level")}
                    >
                      Dodaj styl
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddDanceStyle(false);
                        setValue("new_dance_style_id", "");
                        setValue("new_skill_level", "");
                        setValue("new_years_experience", "");
                        setValue("new_is_teaching", false);
                      }}
                    >
                      Anuluj
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddDanceStyle(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj styl tańca
                </Button>
              )}
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
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/profiles/show")}
            disabled={isSubmitting}
          >
            Anuluj
          </Button>
        </FormActions>
      </Form>
    </SubPage>
  );
};