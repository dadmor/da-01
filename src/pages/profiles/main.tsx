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
  DollarSign,
  Clock,
  Ticket
} from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { supabaseClient } from "@/utility";
import { Separator } from "@/components/ui/separator";
import { useGetIdentity } from "@refinedev/core";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

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

interface Event {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  event_category: string;
  location_type: string;
  address?: string;
  city?: string;
  price_amount?: number;
  current_participants?: number;
  max_participants?: number;
  dance_styles?: { name: string };
  organizer?: { name: string };
}

export const ProfilesMain = () => {
  const navigate = useNavigate();
  const { data: identity } = useGetIdentity<Identity>();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [dancerProfile, setDancerProfile] = useState<DancerProfile | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"dancer" | "school" | "events">("dancer");
  const [myOrganizedEvents, setMyOrganizedEvents] = useState<Event[]>([]);
  const [myParticipatingEvents, setMyParticipatingEvents] = useState<Event[]>([]);
  
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
    if (identity?.id) {
      fetchStatistics();
      fetchMyEvents();
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

  const fetchMyEvents = async () => {
    if (!identity?.id) return;

    try {
      // Wydarzenia, które organizuję
      const { data: organizedEvents } = await supabaseClient
        .from('events')
        .select(`
          *,
          dance_styles (name)
        `)
        .eq('organizer_id', identity.id)
        .gte('start_datetime', new Date().toISOString())
        .eq('status', 'active')
        .order('start_datetime', { ascending: true })
        .limit(5);

      if (organizedEvents) {
        setMyOrganizedEvents(organizedEvents);
      }

      // Wydarzenia, w których uczestniczę
      const { data: participatingData } = await supabaseClient
        .from('event_participants')
        .select(`
          event_id,
          status,
          events!inner (
            id,
            title,
            start_datetime,
            end_datetime,
            event_category,
            location_type,
            address,
            city,
            price_amount,
            current_participants,
            max_participants,
            dance_styles (name),
            users!events_organizer_id_fkey (
              id,
              dancers (name)
            )
          )
        `)
        .eq('participant_id', identity.id)
        .in('status', ['registered', 'confirmed'])
        .gte('events.start_datetime', new Date().toISOString())
        .eq('events.status', 'active')
        .order('events(start_datetime)', { ascending: true })
        .limit(5);

      if (participatingData) {
        const events = participatingData
          .map(p => p.events)
          .filter((event): event is any => event !== null)
          .map(event => ({
            ...event,
            organizer: event.users?.dancers?.[0] || null
          }));
        setMyParticipatingEvents(events);
      }

    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchStatistics = async () => {
    if (!identity?.id) return;

    try {
      // Polubienia otrzymane (tylko jeśli mamy profil tancerza)
      let likesReceived = 0;
      let likesSent = 0;
      let matchCount = 0;
      
      if (dancerProfile?.id) {
        const { count: likesReceivedCount } = await supabaseClient
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('to_dancer_id', dancerProfile.id);
        likesReceived = likesReceivedCount || 0;

        // Polubienia wysłane
        const { count: likesSentCount } = await supabaseClient
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('from_dancer_id', dancerProfile.id);
        likesSent = likesSentCount || 0;

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
        matchCount = sentIds.filter(id => receivedIds.includes(id)).length;
      }

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

      setStats({
        likesReceived,
        likesSent,
        matches: matchCount,
        eventsCreated: eventsCreated || 0,
        eventsAttended: eventsAttended || 0,
        upcomingEvents: upcomingEvents || 0,
        totalStudents: uniqueStudents.size,
        averageRating: 0,
        reviewsCount: 0
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

  const getEventCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'social': 'Impreza',
      'workshop': 'Warsztaty',
      'lesson': 'Lekcja',
      'course': 'Kurs'
    };
    return labels[category] || category;
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
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      <FlexBox>
        <Lead
          title="Mój Profil"
          description="Zarządzaj swoimi profilami tancerza, szkoły tańca i wydarzeniami"
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
        <div className="space-y-6">
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

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "dancer" | "school" | "events")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dancer" disabled={!dancerProfile}>
                <User className="w-4 h-4 mr-2" />
                Profil Tancerza
              </TabsTrigger>
              <TabsTrigger value="school" disabled={!schoolProfile}>
                <School className="w-4 h-4 mr-2" />
                Profil Szkoły
              </TabsTrigger>
              <TabsTrigger value="events">
                <Calendar className="w-4 h-4 mr-2" />
                Wydarzenia
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

            <TabsContent value="events" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Moje Wydarzenia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Wydarzenia w których uczestniczę */}
                  {myParticipatingEvents.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2 text-lg">
                        <Ticket className="w-5 h-5 text-primary" />
                        Wydarzenia, w których uczestniczę
                      </h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        {myParticipatingEvents.map((event) => (
                          <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                              <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                    <h5 className="font-semibold text-lg">{event.title}</h5>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(event.start_datetime), "EEEE, d MMMM yyyy", { locale: pl })}
                                    </p>
                                    {event.organizer && (
                                      <p className="text-sm text-muted-foreground">
                                        Organizator: {event.organizer.name}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-sm">
                                    {format(new Date(event.start_datetime), "HH:mm")}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <Music className="w-3 h-3" />
                                    {event.dance_styles?.name}
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    {getEventCategoryLabel(event.event_category)}
                                  </Badge>
                                  {event.city && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {event.city}
                                    </Badge>
                                  )}
                                  {event.price_amount !== null && event.price_amount !== undefined && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" />
                                      {event.price_amount === 0 ? 'Bezpłatne' : `${event.price_amount} PLN`}
                                    </Badge>
                                  )}
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="w-full mt-3 hover:bg-primary hover:text-primary-foreground transition-colors"
                                  onClick={() => navigate(`/events/show/${event.id}`)}
                                >
                                  Zobacz szczegóły
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      {myParticipatingEvents.length === 5 && (
                        <Button 
                          variant="link" 
                          className="w-full mt-4 text-primary"
                          onClick={() => navigate('/events?participating=true')}
                        >
                          Zobacz wszystkie →
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Wydarzenia które organizuję */}
                  {myOrganizedEvents.length > 0 && (
                    <div className={myParticipatingEvents.length > 0 ? "pt-6 border-t" : ""}>
                      <h4 className="font-medium mb-4 flex items-center gap-2 text-lg">
                        <Trophy className="w-5 h-5 text-primary" />
                        Wydarzenia, które organizuję
                      </h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        {myOrganizedEvents.map((event) => (
                          <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                              <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                    <h5 className="font-semibold text-lg">{event.title}</h5>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(event.start_datetime), "EEEE, d MMMM yyyy", { locale: pl })}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="text-sm">
                                    {format(new Date(event.start_datetime), "HH:mm")}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <Music className="w-3 h-3" />
                                    {event.dance_styles?.name}
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    {getEventCategoryLabel(event.event_category)}
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {event.current_participants}
                                    {event.max_participants && `/${event.max_participants}`}
                                  </Badge>
                                  {event.price_amount !== null && event.price_amount !== undefined && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" />
                                      {event.price_amount === 0 ? 'Bezpłatne' : `${event.price_amount} PLN`}
                                    </Badge>
                                  )}
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="default" 
                                  className="w-full mt-3"
                                  onClick={() => navigate(`/events/show/${event.id}`)}
                                >
                                  Zarządzaj
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      {myOrganizedEvents.length === 5 && (
                        <Button 
                          variant="link" 
                          className="w-full mt-4 text-primary"
                          onClick={() => navigate(`/events?organizer=${identity?.id}`)}
                        >
                          Zobacz wszystkie →
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Gdy nie ma żadnych wydarzeń */}
                  {myParticipatingEvents.length === 0 && myOrganizedEvents.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground mb-4">
                        Nie masz jeszcze żadnych nadchodzących wydarzeń
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/events')}
                      >
                        Przeglądaj wydarzenia
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};