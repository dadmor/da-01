// src/pages/profiles/main.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Settings,
  Users,
  Star,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { supabaseClient } from "@/utility";
import { Separator } from "@/components/ui/separator";
import { useGetIdentity } from "@refinedev/core";

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
  dance_styles: any[];
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

interface Identity {
  id: string;
  email?: string;
  name?: string;
}

export const ProfilesMain = () => {
  const navigate = useNavigate();
  const { data: identity } = useGetIdentity<Identity>();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [dancerProfile, setDancerProfile] = useState<DancerProfile | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"dancer" | "school">("dancer");
  
  // Statystyki
  const [stats, setStats] = useState({
    likesReceived: 0,
    likesSent: 0,
    matches: 0,
    eventsCreated: 0,
    eventsAttended: 0,
    upcomingEvents: 0,
    totalStudents: 0,
    averageRating: 0,
    reviewsCount: 0
  });

  useEffect(() => {
    fetchUserProfiles();
  }, []);

  useEffect(() => {
    if (identity?.id && dancerProfile?.id) {
      fetchStatistics();
    }
  }, [identity?.id, dancerProfile?.id]);

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
            is_teaching,
            years_experience,
            dance_styles (name)
          )
        `)
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (dancerData) {
        setDancerProfile({
          ...dancerData,
          dance_styles: dancerData.dancer_dance_styles || []
        });
      }

      // Get school profile if exists
      const { data: schoolData } = await supabaseClient
        .from('dance_schools')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (schoolData) {
        setSchoolProfile(schoolData);
      }

    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!identity?.id || !dancerProfile?.id) return;

    try {
      // Polubienia otrzymane
      const { count: likesReceived } = await supabaseClient
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('to_dancer_id', dancerProfile.id);

      // Polubienia wysłane
      const { count: likesSent } = await supabaseClient
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('from_dancer_id', dancerProfile.id);

      // Dopasowania (wzajemne polubienia)
      const { data: sentLikes } = await supabaseClient
        .from('likes')
        .select('to_dancer_id')
        .eq('from_dancer_id', dancerProfile.id);

      const { data: receivedLikes } = await supabaseClient
        .from('likes')
        .select('from_dancer_id')
        .eq('to_dancer_id', dancerProfile.id);

      const sentIds = sentLikes?.map(l => l.to_dancer_id) || [];
      const receivedIds = receivedLikes?.map(l => l.from_dancer_id) || [];
      const matchCount = sentIds.filter(id => receivedIds.includes(id)).length;

      // Wydarzenia utworzone
      const { count: eventsCreated } = await supabaseClient
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('organizer_id', identity.id);

      // Wydarzenia uczestnictwo
      const { count: eventsAttended } = await supabaseClient
        .from('event_participants')
        .select('*', { count: 'exact', head: true })
        .eq('participant_id', identity.id)
        .in('status', ['registered', 'confirmed']);

      // Nadchodzące wydarzenia
      const { count: upcomingEvents } = await supabaseClient
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('organizer_id', identity.id)
        .gte('start_datetime', new Date().toISOString())
        .eq('status', 'active');

      // Liczba uczniów (unikalni uczestnicy wydarzeń)
      const { data: participants } = await supabaseClient
        .from('event_participants')
        .select('participant_id')
        .eq('event_type', 'lesson')
        .in('status', ['registered', 'confirmed'])
        .neq('participant_id', identity.id);

      const uniqueStudents = new Set(participants?.map(p => p.participant_id) || []);

      // TODO: Oceny (gdy będzie tabela reviews)
      // const { data: reviews } = await supabaseClient
      //   .from('reviews')
      //   .select('rating_overall')
      //   .eq('reviewed_id', identity.id)
      //   .eq('review_type', 'trainer');

      setStats({
        likesReceived: likesReceived || 0,
        likesSent: likesSent || 0,
        matches: matchCount,
        eventsCreated: eventsCreated || 0,
        eventsAttended: eventsAttended || 0,
        upcomingEvents: upcomingEvents || 0,
        totalStudents: uniqueStudents.size,
        averageRating: 0, // TODO: Calculate from reviews
        reviewsCount: 0 // TODO: Count reviews
      });

    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleCreateProfile = () => {
    navigate("/profiles/create");
  };

  const handleEditProfile = () => {
    navigate("/profiles/edit");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Ładowanie profilu...</p>
      </div>
    );
  }

  const hasAnyProfile = dancerProfile || schoolProfile;
  const isInstructor = dancerProfile?.dance_styles?.some((ds: any) => ds.is_teaching);

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
                    onClick={handleCreateProfile}>
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
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Quick Stats - poprawiony układ dla 3 i 4 kart */}
          {dancerProfile && (
            <div className={`grid gap-4 ${isInstructor ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Heart className="w-8 h-8 text-pink-500/20" />
                      <div className="text-right">
                        <p className="text-3xl font-bold tracking-tight">{stats.likesReceived}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">otrzymanych</p>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Wysłanych</span>
                      <span className="font-medium">{stats.likesSent}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Users className="w-8 h-8 text-blue-500/20" />
                      <div className="text-right">
                        <p className="text-3xl font-bold tracking-tight">{stats.matches}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">dopasowań</p>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Wzajemnych</span>
                      <span className="font-medium">100%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Calendar className="w-8 h-8 text-green-500/20" />
                      <div className="text-right">
                        <p className="text-3xl font-bold tracking-tight">{stats.eventsAttended}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">wydarzeń</p>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Uczestnictwa</span>
                      <span className="font-medium">{isInstructor ? stats.eventsCreated : '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isInstructor && (
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Trophy className="w-8 h-8 text-yellow-500/20" />
                        <div className="text-right">
                          <p className="text-3xl font-bold tracking-tight">{stats.totalStudents}</p>
                          <p className="text-xs text-muted-foreground uppercase tracking-widest">uczniów</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Nadchodzące</span>
                        <span className="font-medium">{stats.upcomingEvents}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

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
                          onClick={handleEditProfile}
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
                            {dancerProfile.dance_styles?.map((ds: any, idx: number) => (
                              <Badge 
                                key={idx} 
                                variant={ds.is_teaching ? "default" : "secondary"}
                              >
                                <Music className="w-3 h-3 mr-1" />
                                {ds.dance_styles?.name}
                                {ds.is_teaching && (
                                  <Trophy className="w-3 h-3 ml-1" />
                                )}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Panel Instruktora */}
                  {isInstructor && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="w-5 h-5" />
                          Panel Instruktora
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Card>
                            <CardContent className="pt-4">
                              <p className="text-sm text-muted-foreground">Nadchodzące zajęcia</p>
                              <p className="text-2xl font-bold">{stats.upcomingEvents}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-4">
                              <p className="text-sm text-muted-foreground">Łącznie uczniów</p>
                              <p className="text-2xl font-bold">{stats.totalStudents}</p>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="space-y-3 pt-2">
                          <Button 
                            className="w-full"
                            onClick={() => navigate("/events/create")}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Utwórz nowe wydarzenie
                          </Button>
                          <Button 
                            variant="outline"
                            className="w-full"
                            onClick={() => navigate(`/events?organizer=${identity?.id}`)}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Zarządzaj wydarzeniami
                          </Button>
                          <Button 
                            variant="outline"
                            className="w-full"
                            disabled
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Finanse (wkrótce)
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Aktywność */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Aktywność</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FlexBox>
                        <div>
                          <p className="font-medium">Widoczność profilu</p>
                          <p className="text-sm text-muted-foreground">
                            Twój profil jest widoczny dla innych
                          </p>
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
                    <Button onClick={handleCreateProfile}>
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
                        disabled
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