// src/pages/profiles/create.tsx
import { useState, useEffect } from "react";
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
import { ArrowLeft, Upload, Calendar } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Form, FormActions, FormControl } from "@/components/form";
import { supabaseClient } from "@/utility";

import { Badge } from "@/components/ui/badge";

const skillLevels = [
  { value: "beginner", label: "Początkujący" },
  { value: "intermediate", label: "Średniozaawansowany" },
  { value: "advanced", label: "Zaawansowany" },
  { value: "professional", label: "Profesjonalny" },
];

interface DanceStyleWithLevel {
  styleId: string;
  level: string;
  yearsExperience?: number;
}

interface DanceStyle {
  id: string;
  name: string;
  category?: string;
}

export const ProfilesCreate = () => {
  const { list } = useNavigation();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [selectedStyles, setSelectedStyles] = useState<DanceStyleWithLevel[]>(
    []
  );
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [danceStylesFromDB, setDanceStylesFromDB] = useState<DanceStyle[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    checkUserAndProfile();
    fetchDanceStyles();
  }, []);

  const checkUserAndProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (user) {
        setCurrentUser(user);

        // Check if user already has a dancer profile
        const { data } = await supabaseClient
          .from("dancers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          setHasExistingProfile(true);
        }
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    } finally {
      setIsCheckingProfile(false);
    }
  };

  const fetchDanceStyles = async () => {
    const { data, error } = await supabaseClient
      .from("dance_styles")
      .select("id, name, category")
      .order("name");

    if (data) {
      setDanceStylesFromDB(data);
      console.log("Dance styles from DB:", data);
    } else if (error) {
      console.error("Error fetching dance styles:", error);
    }
  };

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

  const uploadPhoto = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;

    // Użyj folderu z user_id
    const filePath = `${currentUser.id}/${fileName}`;

    const { data, error } = await supabaseClient.storage
      .from("dancer-photos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabaseClient.storage.from("dancer-photos").getPublicUrl(filePath);

    return publicUrl;
  };
  const handleStyleToggle = (styleId: string) => {
    setSelectedStyles((prev) => {
      const exists = prev.find((s) => s.styleId === styleId);
      if (exists) {
        return prev.filter((s) => s.styleId !== styleId);
      } else {
        return [...prev, { styleId, level: "beginner" }];
      }
    });
  };

  const updateStyleLevel = (styleId: string, level: string) => {
    setSelectedStyles((prev) =>
      prev.map((s) => (s.styleId === styleId ? { ...s, level } : s))
    );
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (!currentUser) {
        console.error("No authenticated user");
        return;
      }

      let profilePhotoUrl = "";

      // Upload photo w osobnym try-catch
      if (photoFile) {
        try {
          console.log("Uploading photo...");
          profilePhotoUrl = await uploadPhoto(photoFile);
          console.log("Photo uploaded:", profilePhotoUrl);
        } catch (uploadError) {
          console.error("Photo upload failed:", uploadError);
          alert(
            "Nie udało się przesłać zdjęcia, ale profil zostanie utworzony"
          );
          // Kontynuuj bez zdjęcia
        }
      }

      // Insert dancer w osobnym try-catch
      try {
        const dancerData = {
          user_id: currentUser.id,
          name: data.name,
          bio: data.bio,
          birth_date: data.birth_date,
          profile_photo_url: profilePhotoUrl || null,
          location_address: data.city,
          search_radius_km: 50,
          is_active: true,
        };

        console.log("Inserting dancer:", dancerData);

        const { data: insertedDancer, error: dancerError } =
          await supabaseClient
            .from("dancers")
            .insert(dancerData)
            .select()
            .single();

        if (dancerError) {
          console.error("Dancer insert error:", dancerError);
          throw dancerError;
        }

        console.log("Dancer created:", insertedDancer);

        // Dance styles w osobnym try-catch
        if (selectedStyles.length > 0 && insertedDancer) {
          try {
            const styleAssociations = selectedStyles.map((style) => ({
              dancer_id: insertedDancer.id,
              dance_style_id: style.styleId, // Teraz to będzie prawdziwe UUID
              skill_level: style.level,
              years_experience: style.yearsExperience || 0,
            }));

            console.log("Style associations:", styleAssociations);

            const { error: stylesError } = await supabaseClient
              .from("dancer_dance_styles")
              .insert(styleAssociations);

            if (stylesError) {
              console.error("Styles insert error:", stylesError);
              alert(
                "Nie udało się dodać stylów tańca, możesz je dodać później edytując profil"
              );
            } else {
              console.log("Dance styles added successfully");
            }
          } catch (stylesError) {
            console.error("Styles error:", stylesError);
          }
        }

        alert("Profil został utworzony pomyślnie!");
        list("profiles");
      } catch (dancerError) {
        console.error("Dancer creation error:", dancerError);
        alert(`Błąd tworzenia profilu: ${dancerError.message}`);
      }
    } catch (error) {
      console.error("General error:", error);
      alert("Wystąpił nieoczekiwany błąd");
    }
  };

  if (isCheckingProfile) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Sprawdzanie profilu...</p>
      </div>
    );
  }

  if (hasExistingProfile) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-lg mb-4">Już posiadasz profil tancerza!</p>
            <Button onClick={() => list("profiles")}>
              Przejdź do swojego profilu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => list("profiles")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Powrót
      </Button>

      <FlexBox>
        <Lead
          title="Utwórz profil tancerza"
          description="Wypełnij swój profil, aby dołączyć do społeczności"
        />
      </FlexBox>

      <Form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="max-w-3xl mx-auto"
      >
        <Card>
          <CardHeader>
            <CardTitle>Podstawowe informacje</CardTitle>
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
                  placeholder="Jan Kowalski"
                  {...register("name", {
                    required: "Imię jest wymagane",
                  })}
                />
              </FormControl>

              <FormControl
                label="Data urodzenia"
                htmlFor="birth_date"
                error={errors.birth_date?.message as string}
                required
              >
                <Input
                  id="birth_date"
                  type="date"
                  {...register("birth_date", {
                    required: "Data urodzenia jest wymagana",
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
            </GridBox>

            <FormControl
              label="Zdjęcie profilowe"
              htmlFor="photo"
              error={errors.photo?.message as string}
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
                placeholder="Opowiedz coś o sobie, swojej pasji do tańca, doświadczeniu..."
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
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Style tańca i poziom umiejętności</CardTitle>
          </CardHeader>
          <CardContent>
            <FormControl
              label="Wybierz style, które tańczysz"
              error={
                selectedStyles.length === 0
                  ? "Wybierz przynajmniej jeden styl"
                  : undefined
              }
              required
            >
              <div className="space-y-4">
                {danceStylesFromDB.length === 0 ? (
                  <p className="text-muted-foreground">
                    Ładowanie stylów tańca...
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {danceStylesFromDB.map((style) => (
                        <Button
                          key={style.id}
                          type="button"
                          variant={
                            selectedStyles.find((s) => s.styleId === style.id)
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => handleStyleToggle(style.id)}
                        >
                          {style.name}
                        </Button>
                      ))}
                    </div>

                    {selectedStyles.length > 0 && (
                      <div className="mt-6 space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Określ swój poziom dla każdego wybranego stylu:
                        </p>
                        {selectedStyles.map((selectedStyle) => {
                          const style = danceStylesFromDB.find(
                            (s) => s.id === selectedStyle.styleId
                          );
                          return (
                            <div
                              key={selectedStyle.styleId}
                              className="flex items-center gap-4 p-3 border rounded-lg"
                            >
                              <Badge variant="secondary">{style?.name}</Badge>
                              <Select
                                value={selectedStyle.level}
                                onValueChange={(value) =>
                                  updateStyleLevel(selectedStyle.styleId, value)
                                }
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {skillLevels.map((level) => (
                                    <SelectItem
                                      key={level.value}
                                      value={level.value}
                                    >
                                      {level.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </FormControl>
          </CardContent>
        </Card>

        <FormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => list("profiles")}
          >
            Anuluj
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || selectedStyles.length === 0}
          >
            {isSubmitting ? "Tworzenie..." : "Utwórz profil"}
          </Button>
        </FormActions>
      </Form>
    </>
  );
};
