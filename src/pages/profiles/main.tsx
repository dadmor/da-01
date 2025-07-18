// src/pages/profiles/main.tsx
import { useState, useEffect } from "react";
import { useNavigation } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  School, 
  Plus, 
  Edit, 
  MapPin, 
  Music, 
  Trophy,
  Calendar,
  Heart,
  MessageCircle,
  Settings
} from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { supabaseClient } from "@/utility";
import { Separator } from "@/components/ui/separator";

interface UserProfile {
  id: string;
  email: string;
  user_type: 'dancer' | 'school' | 'both';
}

interface DancerProfile {
  id: string;
  name: string;
  bio: string;
  birth_date: string;
  profile_photo_url: string;
  location_address: string;
  dance_styles: string[];
  skill_level: string;
  created_at: string;
}

interface SchoolProfile {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  address: string;
  city: string;
  phone: string;
  website: string;
  is_verified: boolean;
  created_at: string;
}

export const ProfilesMain = () => {
  const { create, edit } = useNavigation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [dancerProfile, setDancerProfile] = useState<DancerProfile | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"dancer" | "school">("dancer");

  useEffect(() => {
    fetchUserProfiles();
  }, []);

  const fetchUserProfiles = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user: authUser } } = await supabaseClient.auth.getUser();
      if (!authUser) {
        console.error("No authenticated user");
        return;
      }

      // Get user data
      const { data: userData } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userData) {
        setUser(userData);
      }

      // Get dancer profile if exists
      const { data: dancerData } = await supabaseClient
        .from('dancers')
        .select(`
          *,
          dancer_dance_styles (
            dance_style_id,
            skill_level,
            dance_styles (name)
          )
        `)
        .eq('user_id', authUser.id)
        .maybeSingle(); // Używamy maybeSingle() zamiast single()

      if (dancerData) {
        setDancerProfile({
          ...dancerData,
          dance_styles: dancerData.dancer_dance_styles?.map((ds: any) => ds.dance_styles?.name) || []
        });
      }

      // Get school profile if exists
      const { data: schoolData } = await supabaseClient
        .from('dance_schools')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle(); // Używamy maybeSingle() zamiast single()

      if (schoolData) {
        setSchoolProfile(schoolData);
      }

    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Ładowanie profilu...</p>
      </div>
    );
  }

  const hasAnyProfile = dancerProfile || schoolProfile;

  return (
    <>
      <FlexBox>
        <Lead
          title="Mój Profil"
          description="Zarządzaj swoimi profilami tancerza i szkoły tańca"
        />
      </FlexBox>

      {!hasAnyProfile ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Nie masz jeszcze profilu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-6">
              Utwórz profil, aby dołączyć do społeczności tancerzy
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                    onClick={() => create("profiles")}>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold">Profil Tancerza</h3>
                    <p className="text-sm text-muted-foreground">
                      Znajdź partnera do tańca i dołącz do wydarzeń
                    </p>
                    <Button className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Utwórz profil tancerza
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow opacity-50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-secondary/10 rounded-full flex items-center justify-center">
                      <School className="w-8 h-8 text-secondary" />
                    </div>
                    <h3 className="font-semibold">Profil Szkoły</h3>
                    <p className="text-sm text-muted-foreground">
                      Promuj swoją szkołę i organizuj wydarzenia
                    </p>
                    <Button className="w-full" disabled>
                      <Plus className="w-4 h-4 mr-2" />
                      Wkrótce dostępne
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "dancer" | "school")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dancer" disabled={!dancerProfile}>
                <User className="w-4 h-4 mr-2" />
                Profil Tancerza
              </TabsTrigger>
              <TabsTrigger value="school" disabled={!schoolProfile}>
                <School className="w-4 h-4 mr-2" />
                Profil Szkoły
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dancer" className="space-y-6">
              {dancerProfile ? (
                <>
                  <Card>
                    <CardHeader>
                      <FlexBox>
                        <CardTitle>Profil Tancerza</CardTitle>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => edit("dancers", dancerProfile.id)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edytuj
                        </Button>
                      </FlexBox>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row gap-6">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={dancerProfile.profile_photo_url} />
                          <AvatarFallback className="text-2xl">
                            {dancerProfile.name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="text-xl font-semibold">{dancerProfile.name}</h3>
                            {dancerProfile.location_address && (
                              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="w-4 h-4" />
                                {dancerProfile.location_address}
                              </p>
                            )}
                          </div>
                          <p className="text-sm">{dancerProfile.bio}</p>
                          <div className="flex flex-wrap gap-2">
                            {dancerProfile.dance_styles?.map((style) => (
                              <Badge key={style} variant="secondary">
                                <Music className="w-3 h-3 mr-1" />
                                {style}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <GridBox>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                          <Heart className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">Polubienia</span>
                        </div>
                        <p className="text-2xl font-bold">0</p>
                        <p className="text-sm text-muted-foreground">otrzymanych polubień</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                          <MessageCircle className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">Wiadomości</span>
                        </div>
                        <p className="text-2xl font-bold">0</p>
                        <p className="text-sm text-muted-foreground">aktywnych czatów</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                          <Trophy className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">Dopasowania</span>
                        </div>
                        <p className="text-2xl font-bold">0</p>
                        <p className="text-sm text-muted-foreground">wzajemnych dopasowań</p>
                      </CardContent>
                    </Card>
                  </GridBox>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Ustawienia profilu</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FlexBox>
                        <div>
                          <p className="font-medium">Widoczność profilu</p>
                          <p className="text-sm text-muted-foreground">Twój profil jest widoczny dla innych</p>
                        </div>
                        <Badge variant="outline">Aktywny</Badge>
                      </FlexBox>
                      <Separator />
                      <FlexBox>
                        <div>
                          <p className="font-medium">Data utworzenia</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(dancerProfile.created_at).toLocaleDateString("pl-PL", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </p>
                        </div>
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                      </FlexBox>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground mb-4">Nie masz jeszcze profilu tancerza</p>
                    <Button onClick={() => create("profiles")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Utwórz profil tancerza
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="school" className="space-y-6">
              {schoolProfile ? (
                <Card>
                  <CardHeader>
                    <FlexBox>
                      <CardTitle>Profil Szkoły</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => edit("dance-schools", schoolProfile.id)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edytuj
                      </Button>
                    </FlexBox>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={schoolProfile.logo_url} />
                        <AvatarFallback>{schoolProfile.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">{schoolProfile.name}</h3>
                        <p className="text-muted-foreground">{schoolProfile.city}</p>
                        {schoolProfile.is_verified && (
                          <Badge className="mt-2">Zweryfikowana</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground mb-4">Nie masz jeszcze profilu szkoły</p>
                    <Button disabled>
                      <Plus className="w-4 h-4 mr-2" />
                      Wkrótce dostępne
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  );
};