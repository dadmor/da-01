import { useShow, useNavigation, useGetIdentity, useDelete, useInvalidate } from "@refinedev/core";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
ArrowLeft,
CalendarDays,
MapPin,
Users,
Clock,
Music,
Globe,
Link as LinkIcon,
GraduationCap,
Trophy,
PartyPopper,
BookOpen,
Mic,
Edit,
Trash2,
Share2,
Heart,
UserPlus,
CheckCircle2,
XCircle,
AlertCircle,
Calendar,
CreditCard,
Info,
ExternalLink,
Mail,
Repeat,
} from "lucide-react";
import { GridBox, FlexBox } from "@/components/shared";
import { Badge, Button, Separator } from "@/components/ui";
import { useLoading } from "@/utility";
import { SubPage } from "@/components/layout";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";
import { supabaseClient } from "@/utility/supabaseClient";
import {
AlertDialog,
AlertDialogAction,
AlertDialogCancel,
AlertDialogContent,
AlertDialogDescription,
AlertDialogFooter,
AlertDialogHeader,
AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EventRegistrationButton } from "./components/EventRegistrationButton";


interface DanceStyle {
id: string;
name: string;
}

interface Organizer {
id: string;
name: string;
email: string;
is_verified: boolean;
is_trainer: boolean;
}

interface Event {
id: string;
organizer_id: string;
organizer?: Organizer;
title: string;
description?: string;
event_type: string;
dance_style_id?: string;
dance_style?: DanceStyle;
start_at: string;
end_at: string;
is_recurring: boolean;
recurrence_rule?: any;
parent_event_id?: string;
location_type: string;
location_name?: string;
address?: string;
city?: string;
location_lat?: number;
location_lng?: number;
online_platform?: string;
online_link?: string;
website_url?: string;
registration_url?: string;
min_participants: number;
max_participants?: number;
skill_level_min?: string;
skill_level_max?: string;
price: number;
currency: string;
early_bird_price?: number;
early_bird_deadline?: string;
requires_partner: boolean;
age_min?: number;
age_max?: number;
status: string;
visibility: string;
created_at: string;
updated_at: string;
}

interface Participant {
id: string;
user_id: string;
event_id: string;
status: string;
registered_at: string;
}

interface ParticipantWithUser extends Participant {
user: {
  id: string;
  name: string;
  profile_photo_url?: string;
  is_verified?: boolean;
};
}

export const EventsShow = () => {
const { data: identity } = useGetIdentity<any>();
const { queryResult } = useShow({
  resource: "events",
  meta: {
    select: "*, dance_style:dance_styles(*), organizer:users(*)"
  }
});
const { list, edit } = useNavigation();
const { mutate: deleteEvent } = useDelete();
const invalidate = useInvalidate();

const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [participantCount, setParticipantCount] = useState(0);
const [participants, setParticipants] = useState<ParticipantWithUser[]>([]);
const [loadingParticipants, setLoadingParticipants] = useState(false);

const { data, isLoading, isError, refetch } = queryResult;
const record = data?.data as Event;

// Funkcja do pobrania listy uczestników
const fetchParticipants = async () => {
  if (!record?.id) return;
  
  setLoadingParticipants(true);
  try {
    // Najpierw pobierz samych uczestników
    const { data: participantsData, error } = await supabaseClient
      .from('event_participants')
      .select('*')
      .eq('event_id', record.id)
      .in('status', ['registered', 'confirmed', 'attended'])
      .order('registered_at', { ascending: false });

    console.log('Raw participants data:', participantsData);

    if (error) {
      console.error('Error fetching participants:', error);
      throw error;
    }

    // Jeśli są uczestnicy, pobierz dane użytkowników
    if (participantsData && participantsData.length > 0) {
      const userIds = participantsData.map(p => p.user_id);
      
      const { data: usersData, error: usersError } = await supabaseClient
        .from('users')
        .select('id, name, profile_photo_url, is_verified')
        .in('id', userIds);

      console.log('Users data:', usersData);

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      // Połącz dane
      const participantsWithUsers = participantsData.map(participant => ({
        ...participant,
        user: usersData?.find(u => u.id === participant.user_id) || null
      }));

      console.log('Final participants with users:', participantsWithUsers);
      
      setParticipants(participantsWithUsers);
      setParticipantCount(participantsWithUsers.length);
    } else {
      setParticipants([]);
      setParticipantCount(0);
    }
  } catch (error) {
    console.error('Error in fetchParticipants:', error);
    toast.error('Nie udało się pobrać listy uczestników');
  } finally {
    setLoadingParticipants(false);
  }
};

// Pobierz uczestników gdy record się zmieni
useEffect(() => {
  if (record?.id) {
    fetchParticipants();
  }
}, [record?.id]);

const init = useLoading({ isLoading, isError });
if (init) return init;

if (!record) {
  return (
    <SubPage>
      <div className="text-center py-12">
        <p className="text-red-500 text-lg">Wydarzenie nie zostało znalezione</p>
        <Button className="mt-4" onClick={() => list("events")}>
          Wróć do listy
        </Button>
      </div>
    </SubPage>
  );
}

// Funkcje pomocnicze
const isOrganizer = record.organizer_id === identity?.id;
const isPast = new Date(record.end_at) < new Date();
const isUpcoming = new Date(record.start_at) > new Date();
const isOngoing = !isPast && !isUpcoming;
const spotsLeft = record?.max_participants 
  ? record.max_participants - participantCount 
  : null;
const isFull = spotsLeft !== null && spotsLeft <= 0;
const canRegister = !isPast && !isFull && record.status === 'published' && !isOrganizer;

const getEventTypeIcon = (type: string) => {
  const icons: Record<string, JSX.Element> = {
    lesson: <BookOpen className="w-5 h-5" />,
    workshop: <GraduationCap className="w-5 h-5" />,
    social: <PartyPopper className="w-5 h-5" />,
    competition: <Trophy className="w-5 h-5" />,
    performance: <Mic className="w-5 h-5" />,
  };
  return icons[type] || <CalendarDays className="w-5 h-5" />;
};

const getEventTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    lesson: "Lekcja",
    workshop: "Warsztaty",
    social: "Potańcówka",
    competition: "Zawody",
    performance: "Występ",
  };
  return labels[type] || type;
};

const getLocationTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    physical: "Stacjonarne",
    online: "Online",
    hybrid: "Hybrydowe",
  };
  return labels[type] || type;
};

const getSkillLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    beginner: "Początkujący",
    intermediate: "Średniozaawansowany",
    advanced: "Zaawansowany",
    professional: "Profesjonalny",
  };
  return labels[level] || level;
};

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { icon: JSX.Element; variant: any; label: string }> = {
    draft: { 
      icon: <AlertCircle className="w-4 h-4" />, 
      variant: "secondary", 
      label: "Szkic" 
    },
    published: { 
      icon: <CheckCircle2 className="w-4 h-4" />, 
      variant: "default", 
      label: "Opublikowane" 
    },
    cancelled: { 
      icon: <XCircle className="w-4 h-4" />, 
      variant: "destructive", 
      label: "Odwołane" 
    },
    completed: { 
      icon: <CheckCircle2 className="w-4 h-4" />, 
      variant: "outline", 
      label: "Zakończone" 
    },
  };

  const config = statusConfig[status] || statusConfig.draft;
  return (
    <Badge variant={config.variant}>
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </Badge>
  );
};

const handleDelete = () => {
  deleteEvent(
    {
      resource: "events",
      id: record.id,
    },
    {
      onSuccess: () => {
        toast.success("Wydarzenie zostało usunięte");
        list("events");
      },
      onError: (error) => {
        console.error("Delete error:", error);
        toast.error("Nie udało się usunąć wydarzenia");
      },
    }
  );
};

const handleShare = () => {
  if (navigator.share) {
    navigator.share({
      title: record.title,
      text: record.description,
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link skopiowany do schowka");
  }
};

return (
  <SubPage>
    <FlexBox>
      <Button
        variant="outline"
        size="sm"
        onClick={() => list("events")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Wróć do listy
      </Button>

      {isOrganizer && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => edit("events", record.id)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edytuj
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Usuń
          </Button>
        </div>
      )}
    </FlexBox>

    {/* Nagłówek wydarzenia */}
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Typ i status */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="text-sm">
              {getEventTypeIcon(record.event_type)}
              <span className="ml-1">{getEventTypeLabel(record.event_type)}</span>
            </Badge>
            {getStatusBadge(record.status)}
            {isPast && (
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" />
                Zakończone
              </Badge>
            )}
            {isOngoing && (
              <Badge variant="default" className="bg-green-500">
                <Clock className="w-3 h-3 mr-1" />
                W trakcie
              </Badge>
            )}
            {record.is_recurring && (
              <Badge variant="outline">
                <Repeat className="w-3 h-3 mr-1" />
                Cykliczne
              </Badge>
            )}
          </div>

          {/* Tytuł */}
          <h1 className="text-3xl font-bold">{record.title}</h1>

          {/* Organizator */}
          {record.organizer && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Organizator: {record.organizer.name}</span>
              {record.organizer.is_verified && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Zweryfikowany
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    <GridBox>
      {/* Główne informacje */}
      <div className="lg:col-span-2 space-y-6">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Szczegóły</TabsTrigger>
            <TabsTrigger value="participants">
              Uczestnicy ({participantCount})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-6">
            {/* Opis */}
            {record.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Opis wydarzenia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{record.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Szczegóły */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Szczegóły
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Data i czas */}
                <div>
                  <p className="text-sm font-medium mb-1">Data i czas</p>
                  <div className="space-y-1">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {format(new Date(record.start_at), "EEEE, d MMMM yyyy", { locale: pl })}
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {format(new Date(record.start_at), "HH:mm")} - 
                      {format(new Date(record.end_at), "HH:mm")}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Lokalizacja */}
                <div>
                  <p className="text-sm font-medium mb-1">Lokalizacja</p>
                  <Badge variant="outline" className="mb-2">
                    {getLocationTypeLabel(record.location_type)}
                  </Badge>
                  
                  {record.location_type === 'online' ? (
                    <div className="space-y-2 mt-2">
                      {record.online_platform && (
                        <p className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          {record.online_platform}
                        </p>
                      )}
                      {record.online_link && (
                        <Button
                          variant="link"
                          className="p-0 h-auto justify-start"
                          onClick={() => window.open(record.online_link, '_blank')}
                        >
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Link do spotkania
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {record.location_name && (
                        <p className="font-medium">{record.location_name}</p>
                      )}
                      {record.address && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {record.address}
                        </p>
                      )}
                      {record.city && (
                        <p className="text-muted-foreground">{record.city}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Styl tańca i poziom */}
                {(record.dance_style || record.skill_level_min || record.skill_level_max) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      {record.dance_style && (
                        <div>
                          <p className="text-sm font-medium mb-1">Styl tańca</p>
                          <Badge variant="secondary">
                            <Music className="w-3 h-3 mr-1" />
                            {record.dance_style.name}
                          </Badge>
                        </div>
                      )}
                      
                      {(record.skill_level_min || record.skill_level_max) && (
                        <div>
                          <p className="text-sm font-medium mb-1">Poziom</p>
                          <p className="text-sm">
                            {record.skill_level_min && getSkillLevelLabel(record.skill_level_min)}
                            {record.skill_level_min && record.skill_level_max && 
                              record.skill_level_min !== record.skill_level_max && ' - '}
                            {record.skill_level_max && record.skill_level_min !== record.skill_level_max && 
                              getSkillLevelLabel(record.skill_level_max)}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Wymagania */}
                {(record.requires_partner || record.age_min || record.age_max) && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Wymagania</p>
                      <div className="space-y-1">
                        {record.requires_partner && (
                          <Badge variant="outline">
                            <UserPlus className="w-3 h-3 mr-1" />
                            Wymagany partner
                          </Badge>
                        )}
                        {(record.age_min || record.age_max) && (
                          <p className="text-sm text-muted-foreground">
                            Wiek: {record.age_min || '0'} - {record.age_max || '99'} lat
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Linki */}
                {(record.website_url || record.registration_url) && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Linki</p>
                      <div className="space-y-2">
                        {record.website_url && (
                          <Button
                            variant="link"
                            className="p-0 h-auto justify-start"
                            onClick={() => window.open(record.website_url, '_blank')}
                          >
                            <Globe className="w-4 h-4 mr-2" />
                            Strona wydarzenia
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                        {record.registration_url && (
                          <Button
                            variant="link"
                            className="p-0 h-auto justify-start"
                            onClick={() => window.open(record.registration_url, '_blank')}
                          >
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Rejestracja zewnętrzna
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="participants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Lista uczestników
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingParticipants ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Ładowanie listy uczestników...
                  </div>
                ) : participants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Brak zapisanych uczestników
                  </div>
                ) : (
                  <div className="space-y-3">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={participant.user?.profile_photo_url}
                              alt={participant.user?.name}
                            />
                            <AvatarFallback>
                              {participant.user?.name?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {participant.user?.name || 'Nieznany użytkownik'}
                              </p>
                              {participant.user?.is_verified && (
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Zweryfikowany
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Zapisany: {format(new Date(participant.registered_at), "d MMM yyyy, HH:mm", { locale: pl })}
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          participant.status === 'attended' ? 'default' :
                          participant.status === 'confirmed' ? 'secondary' :
                          'outline'
                        }>
                          {participant.status === 'attended' ? 'Uczestniczył' :
                           participant.status === 'confirmed' ? 'Potwierdzony' :
                           'Zapisany'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                
                {isOrganizer && participants.length > 0 && (
                  <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                    <p>Jako organizator widzisz pełną listę uczestników.</p>
                  </div>
                )}
                
                {!isOrganizer && participants.length > 0 && (
                  <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                    <p>Lista uczestników jest widoczna dla wszystkich zapisanych.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Panel boczny */}
      <div className="space-y-6">
        {/* Cena i rejestracja */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Udział</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cena */}
            <div>
              <p className="text-sm font-medium mb-2">Cena</p>
              {record.price > 0 ? (
                <div className="space-y-2">
                  <p className="text-2xl font-bold">
                    {record.price} {record.currency}
                  </p>
                  {record.early_bird_price && record.early_bird_deadline && 
                   new Date(record.early_bird_deadline) > new Date() && (
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                      <p className="text-sm text-green-600 dark:text-green-400">
                        <CreditCard className="w-3 h-3 inline mr-1" />
                        Early Bird: {record.early_bird_price} {record.currency}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        do {format(new Date(record.early_bird_deadline), "d MMM", { locale: pl })}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <Badge variant="default" className="bg-green-500">
                  Bezpłatne
                </Badge>
              )}
            </div>

            <Separator />

            {/* Liczba miejsc */}
            <div>
              <p className="text-sm font-medium mb-2">Liczba miejsc</p>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {participantCount} {participantCount === 1 ? 'osoba zapisana' : 'zapisanych'}
                </span>
                {record.max_participants && (
                  <span className="text-sm text-muted-foreground">
                    z {record.max_participants}
                  </span>
                )}
              </div>
              
              {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 5 && (
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                  Pozostało tylko {spotsLeft} {spotsLeft === 1 ? 'miejsce' : spotsLeft <= 4 ? 'miejsca' : 'miejsc'}!
                </p>
              )}
              
              {isFull && (
                <Badge variant="destructive" className="mt-2 w-full justify-center">
                  Brak wolnych miejsc
                </Badge>
              )}
            </div>

            {/* Przycisk rejestracji */}
            {!isOrganizer && (
              <>
                <Separator />
                <EventRegistrationButton
                  eventId={record.id}
                  className="w-full"
                  disabled={!canRegister && !record.status}
                  onRegistrationChange={(isRegistered, newCount) => {
                    setParticipantCount(newCount);
                    fetchParticipants();
                  }}
                />
                
                {!canRegister && (
                  <p className="text-xs text-center text-muted-foreground">
                    {isPast ? "Wydarzenie się zakończyło" :
                     isFull ? "Brak wolnych miejsc" :
                     record.status !== 'published' ? "Wydarzenie nie jest opublikowane" :
                     "Rejestracja niedostępna"}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Akcje */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Akcje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Udostępnij
            </Button>
            
            <Button variant="outline" className="w-full">
              <Heart className="w-4 h-4 mr-2" />
              Dodaj do ulubionych
            </Button>

            {record.organizer && (
              <Button variant="outline" className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                Kontakt z organizatorem
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Informacje o wydarzeniu */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informacje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Utworzono:{" "}
              {format(new Date(record.created_at), "d MMM yyyy", { locale: pl })}
            </p>
            <p>
              Ostatnia aktualizacja:{" "}
              {format(new Date(record.updated_at), "d MMM yyyy", { locale: pl })}
            </p>
            <p>
              ID wydarzenia: {record.id.slice(0, 8)}...
            </p>
          </CardContent>
        </Card>
      </div>
    </GridBox>

    {/* Dialog potwierdzenia usunięcia */}
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć to wydarzenie?</AlertDialogTitle>
          <AlertDialogDescription>
            Ta akcja jest nieodwracalna. Wydarzenie "{record.title}" zostanie trwale usunięte
            wraz ze wszystkimi zapisami uczestników.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Usuń wydarzenie
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </SubPage>
);
};