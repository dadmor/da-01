// src/pages/profiles/edit.tsx
import { useState, useEffect } from "react";
import { useForm } from "@refinedev/react-hook-form";
import { useNavigation, useUpdate } from "@refinedev/core";
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
import { supabaseClient } from "@/utility";

import { Badge } from "@/components/ui/badge";

const danceStyles = [
  { id: "salsa", name: "Salsa", category: "Latin" },
  { id: "bachata", name: "Bachata", category: "Latin" },
  { id: "tango", name: "Tango", category: "Latin" },
  { id: "walc", name: "Walc", category: "Standard" },
  { id: "cha-cha", name: "Cha-cha", category: "Latin" },
  { id: "rumba", name: "Rumba", category: "Latin" },
  { id: "samba", name: "Samba", category: "Latin" },
  { id: "jazz", name: "Jazz", category: "Modern" },
  { id: "hip-hop", name: "Hip-hop", category: "Modern" },
  { id: "balet", name: "Balet", category: "Classical" },
];

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

export const ProfilesEdit = () => {
  const { list } = useNavigation();
  const { mutate: updateDancer } = useUpdate();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [selectedStyles, setSelectedStyles] = useState<DanceStyleWithLevel[]>([]);
  const [dancerProfile, setDancerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    fetchDancerProfile();
  }, []);

  const fetchDancerProfile = async () => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      // Get dancer profile with dance styles
      const { data: dancerData } = await supabaseClient
        .from('dancers')
        .select(`
          *,
          dancer_dance_styles (
            dance_style_id,
            skill_level,
            years_experience
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle(); // Używamy maybeSingle() zamiast single()

      if (!dancerData) {
        console.error("No dancer profile found");
        list("profiles");
        return;
      }

      setDancerProfile(dancerData);
      
      // Set form values
      reset({
        name: dancerData.name,
        bio: dancerData.bio,
        birth_date: dancerData.birth_date,
        city: dancerData.location_address,
      });

      // Set photo preview
      if (dancerData.profile_photo_url) {
        setPhotoPreview(dancerData.profile_photo_url);
      }

      // Set selected dance styles
      if (dancerData.dancer_dance_styles) {
        setSelectedStyles(
          dancerData.dancer_dance_styles.map((ds: any) => ({
            styleId: ds.dance_style_id,
            level: ds.skill_level,
            yearsExperience: ds.years_experience,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
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
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("No user");

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const { data, error } = await supabaseClient.storage
      .from('dancer-photos')
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabaseClient.storage
      .from('dancer-photos')
      .getPublicUrl(fileName);
      
    return publicUrl;
  };

  const handleStyleToggle = (styleId: string) => {
    setSelectedStyles(prev => {
      const exists = prev.find(s => s.styleId === styleId);
      if (exists) {
        return prev.filter(s => s.styleId !== styleId);
      } else {
        return [...prev, { styleId, level: "beginner" }];
      }
    });
  };

  const updateStyleLevel = (styleId: string, level: string) => {
    setSelectedStyles(prev => 
      prev.map(s => s.styleId === styleId ? { ...s, level } : s)
    );
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (!dancerProfile) return;

      let profilePhotoUrl = dancerProfile.profile_photo_url;
      if (photoFile) {
        profilePhotoUrl = await uploadPhoto(photoFile);
      }

      // Update dancer profile
      updateDancer(
        {
          resource: "dancers",
          id: dancerProfile.id,
          values: {
            name: data.name,
            bio: data.bio,
            birth_date: data.birth_date,
            profile_photo_url: profilePhotoUrl,
            location_address: data.city,
          },
        },
        {
          onSuccess: async () => {
            // Update dance style associations
            // First, delete existing associations
            await supabaseClient
              .from('dancer_dance_styles')
              .delete()
              .eq('dancer_id', dancerProfile.id);

            // Then, insert new associations
            if (selectedStyles.length > 0) {
              const styleAssociations = selectedStyles.map(style => ({
                dancer_id: dancerProfile.id,
                dance_style_id: style.styleId,
                skill_level: style.level,
                years_experience: style.yearsExperience || 0,
              }));

              const { error } = await supabaseClient
                .from('dancer_dance_styles')
                .insert(styleAssociations);

              if (error) {
                console.error("Error updating dance styles:", error);
              }
            }

            // Redirect to profiles page
            list("profiles");
          },
          onError: (error) => {
            console.error("Error updating dancer profile:", error);
          },
        }
      );
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Ładowanie profilu...</p>
      </div>
    );
  }

  if (!dancerProfile) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => list("profiles")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Powrót do profilu
      </Button>

      <FlexBox>
        <Lead
          title="Edytuj profil tancerza"
          description="Zaktualizuj swoje informacje"
        />
      </FlexBox>

      <Form onSubmit={handleSubmit(handleFormSubmit)} className="max-w-3xl mx-auto">
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
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Style tańca i poziom umiejętności</CardTitle>
          </CardHeader>
          <CardContent>
            <FormControl
              label="Wybierz style, które tańczysz"
              error={selectedStyles.length === 0 ? "Wybierz przynajmniej jeden styl" : undefined}
              required
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {danceStyles.map((style) => (
                    <Button
                      key={style.id}
                      type="button"
                      variant={selectedStyles.find(s => s.styleId === style.id) ? "default" : "outline"}
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
                      const style = danceStyles.find(s => s.id === selectedStyle.styleId);
                      return (
                        <div key={selectedStyle.styleId} className="flex items-center gap-4 p-3 border rounded-lg">
                          <Badge variant="secondary">{style?.name}</Badge>
                          <Select
                            value={selectedStyle.level}
                            onValueChange={(value) => updateStyleLevel(selectedStyle.styleId, value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {skillLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
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
            {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </FormActions>
      </Form>
    </>
  );
};