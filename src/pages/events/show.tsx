// ------ src/pages/events/show.tsx ------
import { useShow, useNavigation, useGetIdentity, useDelete } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  Clock,
  Music,
  DollarSign,
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
  Phone,
  Repeat,
} from "lucide-react";
import { GridBox, FlexBox } from "@/components/shared";
import { Badge, Button, Separator } from "@/components/ui";
import { useLoading } from "@/utility";
import { SubPage } from "@/components/layout";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useState } from "react";
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
  participant_count: number;
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
  status: string;
  registered_at: string;
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
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [userParticipation, setUserParticipation] = useState<Participant | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data, isLoading, isError } = queryResult;
  const record = data?.data as Event;

  // Sprawdź czy użytkownik jest zapisany
  useState(() => {
    if (identity?.id && record?.id) {
      supabaseClient
        .from('event_participants')
        .select('*')
        .eq('event_id', record.id)
        .eq('user_id', identity.id)
        .single()
        .then(({ data }) => {
          if (data) setUserParticipation(data);
        });
    }
  });

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
  const spotsLeft = record.max_participants 
    ? record.max_participants - record.participant_count 
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

  const handleRegistration = async () => {
    if (!identity?.id) {
      toast.error("Musisz być zalogowany", {
        description: "Zaloguj się, aby zapisać się na wydarzenie",
      });
      return;
    }

    setIsRegistering(true);

    try {
      if (userParticipation) {
        // Wypisz się
        const { error } = await supabaseClient
          .from('event_participants')
          .delete()
          .eq('id', userParticipation.id);

        if (error) throw error;

        setUserParticipation(null);
        toast.success("Wypisano z wydarzenia");
      } else {
        // Zapisz się
        const { data, error } = await supabaseClient
          .from('event_participants')
          .insert({
            event_id: record.id,
            user_id: identity.id,
            status: 'registered'
          })
          .select()
          .single();

        if (error) throw error;

        setUserParticipation(data);
        toast.success("Zapisano na wydarzenie!", {
          description: "Otrzymasz potwierdzenie na email",
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error("Błąd", {
        description: error.message || "Nie udało się wykonać operacji",
      });
    } finally {
      setIsRegistering(false);
    }
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
                      <a
                        href={record.online_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Link do spotkania
                        <ExternalLink className="w-3 h-3" />
                      </a>
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
                        <a
                          href={record.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Globe className="w-4 h-4" />
                          Strona wydarzenia
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {record.registration_url && (
                        <a
                          href={record.registration_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <LinkIcon className="w-4 h-4" />
                          Rejestracja zewnętrzna
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
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
                    {record.participant_count} zapisanych
                  </span>
                  {record.max_participants && (
                    <span className="text-sm text-muted-foreground">
                      z {record.max_participants}
                    </span>
                  )}
                </div>
                
                {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 5 && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                    Pozostało tylko {spotsLeft} {spotsLeft === 1 ? 'miejsce' : 'miejsca'}!
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
                  <Button
                    className="w-full"
                    variant={userParticipation ? "outline" : "default"}
                    disabled={!canRegister && !userParticipation || isRegistering}
                    onClick={handleRegistration}
                  >
                    {isRegistering ? (
                      "Przetwarzanie..."
                    ) : userParticipation ? (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Wypisz się
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Zapisz się
                      </>
                    )}
                  </Button>
                  
                  {!canRegister && !userParticipation && (
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