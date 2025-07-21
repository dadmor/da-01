// src/pages/profiles/edit.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { supabaseClient } from "@/utility";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";

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
  isTeaching?: boolean;
}

interface DanceStyle {
  id: string;
  name: string;
  category?: string;
}

export const ProfilesEdit = () => {
  const navigate = useNavigate();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [selectedStyles, setSelectedStyles] = useState<DanceStyleWithLevel[]>([]);
  const [dancerProfile, setDancerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [danceStylesFromDB, setDanceStylesFromDB] = useState<DanceStyle[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    fetchDancerProfile();
    fetchDanceStyles();
  }, []);

  const fetchDanceStyles = async () => {
    const { data, error } = await supabaseClient
      .from("dance_styles")
      .select("id, name, category")
      .order("name");

    if (data) {
      setDanceStylesFromDB(data);
    } else if (error) {
      console.error("Error fetching dance styles:", error);
    }
  };

  const fetchDancerProfile = async () => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        navigate("/profiles/create");
        return;
      }

      // Get dancer profile with dance styles
      const { data: dancerData, error } = await supabaseClient
        .from('dancers')
        .select(`
          *,
          dancer_dance_styles (
            dance_style_id,
            skill_level,
            years_experience,
            is_teaching
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        navigate("/profiles/create");
        return;
      }

      if (!dancerData) {
        console.error("No dancer profile found");
        navigate("/profiles/create");
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
            isTeaching: ds.is_teaching || false,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      navigate("/profiles/create");
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
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabaseClient.storage
      .from('dancer-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

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
        return [...prev, { styleId, level: "beginner", isTeaching: false }];
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
      
      // Upload new photo if selected
      if (photoFile) {
        try {
          profilePhotoUrl = await uploadPhoto(photoFile);
        } catch (error) {
          console.error("Photo upload error:", error);
          alert("Nie udało się przesłać zdjęcia, ale profil zostanie zaktualizowany");
        }
      }

      // Update dancer profile
      const { error: updateError } = await supabaseClient
        .from('dancers')
        .update({
          name: data.name,
          bio: data.bio,
          birth_date: data.birth_date,
          profile_photo_url: profilePhotoUrl,
          location_address: data.city,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dancerProfile.id);

      if (updateError) {
        console.error("Update error:", updateError);
        
        // Sprawdź specyficzne błędy
        if (updateError.code === '23514') {
          if (updateError.message.includes('chk_dancer_adult')) {
            alert("Musisz mieć ukończone 18 lat.");
            return;
          } else if (updateError.message.includes('chk_dancer_bio_length')) {
            alert("Opis jest za długi (maksymalnie 500 znaków).");
            return;
          }
        }
        
        alert(`Błąd podczas aktualizacji profilu: ${updateError.message || 'Nieznany błąd'}`);
        return;
      }

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
          is_teaching: style.isTeaching || false,
        }));

        const { error } = await supabaseClient
          .from('dancer_dance_styles')
          .insert(styleAssociations);

        if (error) {
          console.error("Error updating dance styles:", error);
          alert("Nie udało się zaktualizować stylów tańca");
        }
      }

      alert("Profil został zaktualizowany!");
      navigate("/profiles/main");

    } catch (error) {
      console.error("Error in form submission:", error);
      alert("Wystąpił błąd podczas aktualizacji profilu");
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
        onClick={() => navigate("/profiles/main")}
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
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  {...register("birth_date", {
                    required: "Data urodzenia jest wymagana",
                    validate: {
                      isAdult: (value) => {
                        const birthDate = new Date(value);
                        const today = new Date();
                        const age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        const dayDiff = today.getDate() - birthDate.getDate();
                        
                        const realAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
                        
                        return realAge >= 18 || "Musisz mieć ukończone 18 lat";
                      }
                    }
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
                {danceStylesFromDB.length === 0 ? (
                  <p className="text-muted-foreground">Ładowanie stylów tańca...</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {danceStylesFromDB.map((style) => (
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
                          const style = danceStylesFromDB.find(s => s.id === selectedStyle.styleId);
                          return (
                            <div key={selectedStyle.styleId} className="p-4 border rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="text-base">
                                  {style?.name}
                                </Badge>
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
                              
                              {/* OPCJA NAUCZANIA - TO JEST KLUCZOWE! */}
                              <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`teaching-${selectedStyle.styleId}`}
                                    checked={selectedStyle.isTeaching || false}
                                    onCheckedChange={(checked) => {
                                      setSelectedStyles(prev => 
                                        prev.map(s => 
                                          s.styleId === selectedStyle.styleId 
                                            ? { ...s, isTeaching: checked }
                                            : s
                                        )
                                      );
                                    }}
                                  />
                                  <Label 
                                    htmlFor={`teaching-${selectedStyle.styleId}`}
                                    className="font-medium cursor-pointer"
                                  >
                                    Uczę tego stylu
                                  </Label>
                                </div>
                                
                                {selectedStyle.isTeaching && (
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm">Lat doświadczenia:</Label>
                                    <Input
                                      type="number"
                                      className="w-20"
                                      min="0"
                                      max="50"
                                      value={selectedStyle.yearsExperience || ''}
                                      onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        setSelectedStyles(prev => 
                                          prev.map(s => 
                                            s.styleId === selectedStyle.styleId 
                                              ? { ...s, yearsExperience: value }
                                              : s
                                          )
                                        );
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
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
            onClick={() => navigate("/profiles/main")}
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