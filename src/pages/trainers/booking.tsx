// src/pages/trainers/booking.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Star,
  Users,    
  Award,
  Video,
  Check,
  X,
  Info,
  CalendarDays,
} from "lucide-react";
import { supabaseClient } from "@/utility/supabaseClient";
import { toast } from "sonner";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isAfter, isBefore, parse } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/utility";
import { useGetIdentity } from "@refinedev/core";
import { EventRegistrationButton } from "../events/components/EventRegistrationButton";


interface TrainerProfile {
  id: string;
  name: string;
  bio?: string;
  profile_photo_url?: string;
  city?: string;
  is_verified: boolean;
  // Statystyki
  total_events?: number;
  average_rating?: number;
  review_count?: number;
}

interface TimeSlot {
  id: string;
  event_id?: string;
  date: Date;
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_recurring?: boolean;
  event?: {
    id: string;
    title: string;
    event_type: string;
    location_type: string;
    price: number;
    participant_count: number;
    max_participants: number;
  };
}

interface DanceStyle {
  style_name: string;
  skill_level: string;
}

export const TrainerBooking = () => {
  const { trainerId } = useParams<{ trainerId: string }>();
  const navigate = useNavigate();
  const { data: identity } = useGetIdentity<any>();
  
  const [trainer, setTrainer] = useState<TrainerProfile | null>(null);
  const [danceStyles, setDanceStyles] = useState<DanceStyle[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState<'calendar' | 'confirmation'>('calendar');

  // Pobierz dane trenera
  useEffect(() => {
    if (!trainerId) return;
    
    const fetchTrainerData = async () => {
      try {
        // Dane trenera z widoku
        const { data: trainerData, error: trainerError } = await supabaseClient
          .from('v_trainer_stats')
          .select('*')
          .eq('trainer_id', trainerId)
          .single();

        if (trainerError) throw trainerError;
        setTrainer(trainerData);

        // Style tańca trenera
        const { data: styles, error: stylesError } = await supabaseClient
          .from('user_dance_styles')
          .select(`
            skill_level,
            dance_styles!inner (
              name
            )
          `)
          .eq('user_id', trainerId)
          .eq('is_teaching', true);

        if (!stylesError && styles) {
          setDanceStyles(styles.map(s => ({
            style_name: (s.dance_styles as any)?.name || '',
            skill_level: s.skill_level
          })));
        }
      } catch (error) {
        console.error('Error fetching trainer:', error);
        toast.error("Nie udało się pobrać danych trenera");
      }
    };

    fetchTrainerData();
  }, [trainerId]);

  // Pobierz dostępne terminy
  const fetchTimeSlots = async () => {
    setIsLoading(true);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    try {
      // Pobierz wydarzenia trenera w tym tygodniu Z WIDOKU
      const { data: events, error } = await supabaseClient
        .from('v_events_with_counts')
        .select('*')
        .eq('organizer_id', trainerId)
        .gte('start_at', weekStart.toISOString())
        .lte('start_at', weekEnd.toISOString())
        .in('status', ['published'])
        .order('start_at');

      if (error) throw error;

      // Konwertuj wydarzenia na sloty czasowe
      const slots: TimeSlot[] = [];
      
      if (events) {
        events.forEach(event => {
          const eventDate = new Date(event.start_at);
          const startTime = format(eventDate, 'HH:mm');
          const endTime = format(new Date(event.end_at), 'HH:mm');
          
          slots.push({
            id: event.id,
            event_id: event.id,
            date: eventDate,
            start_time: startTime,
            end_time: endTime,
            is_available: false, // Event już istnieje
            is_recurring: event.is_recurring,
            event: {
              id: event.id,
              title: event.title,
              event_type: event.event_type,
              location_type: event.location_type,
              price: event.price,
              participant_count: event.participant_count || 0, // Z widoku
              max_participants: event.max_participants || 999,
            }
          });
        });
      }

      setTimeSlots(slots);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast.error("Nie udało się pobrać terminów");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (!trainerId) return;
    fetchTimeSlots();
  }, [trainerId, weekStart]);

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newWeekStart = direction === 'next' 
      ? addDays(weekStart, 7)
      : addDays(weekStart, -7);
    
    // Nie pozwól na cofnięcie się przed bieżący tydzień
    if (!isBefore(newWeekStart, startOfWeek(new Date(), { weekStartsOn: 1 }))) {
      setWeekStart(newWeekStart);
    }
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.event) {
      // Jeśli to wydarzenie grupowe z wolnymi miejscami
      if (slot.event.participant_count < slot.event.max_participants) {
        setSelectedSlot(slot);
        setBookingStep('confirmation');
      } else {
        toast.error("Brak wolnych miejsc");
      }
    }
  };

  // Funkcje pomocnicze
  const getDaysOfWeek = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  };

  // Pobierz eventy trenera i grupuj je po dniach/godzinach
  const getEventsForDay = (date: Date) => {
    return timeSlots.filter(slot => isSameDay(slot.date, date))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      lesson: "Lekcja",
      workshop: "Warsztaty",
      social: "Potańcówka",
    };
    return labels[type] || type;
  };

  if (!trainer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Wróć
          </Button>

          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={trainer.profile_photo_url} />
              <AvatarFallback>{trainer.name?.[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{trainer.name}</h1>
                {trainer.is_verified && (
                  <Badge variant="secondary">
                    <Award className="w-3 h-3 mr-1" />
                    Zweryfikowany
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                {trainer.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {trainer.city}
                  </span>
                )}
                {trainer.average_rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {trainer.average_rating.toFixed(1)} ({trainer.review_count})
                  </span>
                )}
                {trainer.total_events && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {trainer.total_events} wydarzeń
                  </span>
                )}
              </div>

              {danceStyles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {danceStyles.map((style, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {style.style_name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {bookingStep === 'calendar' ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Kalendarz */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Wybierz termin</h2>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWeekChange('prev')}
                        disabled={isBefore(addDays(weekStart, -7), startOfWeek(new Date(), { weekStartsOn: 1 }))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium px-3">
                        {format(weekStart, 'd MMM', { locale: pl })} - 
                        {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: pl })}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWeekChange('next')}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-96">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <div className="min-w-[800px]">
                        {/* Nagłówek z dniami */}
                        <div className="grid grid-cols-7 gap-2 p-4 border-b">
                          {getDaysOfWeek().map((day) => (
                            <div key={day.toISOString()} className="text-center">
                              <div className="text-sm font-medium text-muted-foreground">
                                {format(day, 'EEE', { locale: pl })}
                              </div>
                              <div className={cn(
                                "text-lg font-semibold",
                                isSameDay(day, new Date()) && "text-primary"
                              )}>
                                {format(day, 'd')}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Kalendarz z eventami */}
                        <div className="grid grid-cols-7 gap-2 p-4">
                          {getDaysOfWeek().map((day) => {
                            const dayEvents = getEventsForDay(day);
                            const isPast = isBefore(day, new Date()) && !isSameDay(day, new Date());
                            
                            return (
                              <div key={day.toISOString()} className="min-h-[300px]">
                                {isPast ? (
                                  <div className="text-center text-sm text-muted-foreground py-8">
                                    -
                                  </div>
                                ) : dayEvents.length === 0 ? (
                                  <div className="text-center text-sm text-muted-foreground py-8">
                                    Brak zajęć
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {dayEvents.map((slot) => {
                                      if (!slot.event) return null;
                                      const isFull = slot.event.participant_count >= slot.event.max_participants;
                                      
                                      return (
                                        <button
                                          key={slot.id}
                                          onClick={() => handleSlotClick(slot)}
                                          disabled={isFull}
                                          className={cn(
                                            "w-full p-3 rounded-lg text-left transition-all text-xs",
                                            "hover:scale-105 hover:shadow-md",
                                            isFull
                                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                              : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                                          )}
                                        >
                                          <div className="font-semibold">
                                            {slot.start_time} - {slot.end_time}
                                          </div>
                                          <div className="mt-1 line-clamp-2">
                                            {slot.event.title}
                                          </div>
                                          <div className="flex items-center justify-between mt-2">
                                            <span>
                                              <Users className="w-3 h-3 inline mr-1" />
                                              {slot.event.participant_count}/{slot.event.max_participants}
                                            </span>
                                            {slot.event.price > 0 && (
                                              <span className="font-semibold">
                                                {slot.event.price} PLN
                                              </span>
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Panel informacyjny */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Legenda</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded" />
                    <span className="text-sm">Zajęcia grupowe - są miejsca</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-100 rounded" />
                    <span className="text-sm">Brak wolnych miejsc</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Informacje</h3>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    Kliknij na wolny termin aby zarezerwować zajęcia
                  </p>
                  <p className="flex items-start gap-2">
                    <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    Zajęcia trwają zazwyczaj 60 minut
                  </p>
                  <p className="flex items-start gap-2">
                    <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    Możesz dołączyć do istniejących zajęć grupowych
                  </p>
                </CardContent>
              </Card>

              {trainer.bio && (
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold">O trenerze</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {trainer.bio}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          /* Potwierdzenie rezerwacji */
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Potwierdź rezerwację</h2>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedSlot?.event && (
                  <>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold">{selectedSlot.event.title}</h3>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Data i godzina</p>
                          <p className="font-medium">
                            {format(selectedSlot.date, 'EEEE, d MMMM yyyy', { locale: pl })}
                            <br />
                            {selectedSlot.start_time} - {selectedSlot.end_time}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-muted-foreground">Rodzaj zajęć</p>
                          <p className="font-medium">{getEventTypeLabel(selectedSlot.event.event_type)}</p>
                        </div>
                        
                        <div>
                          <p className="text-muted-foreground">Lokalizacja</p>
                          <p className="font-medium">
                            {selectedSlot.event.location_type === 'online' ? (
                              <span className="flex items-center gap-1">
                                <Video className="w-4 h-4" />
                                Online
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {trainer.city}
                              </span>
                            )}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-muted-foreground">Cena</p>
                          <p className="font-medium">
                            {selectedSlot.event.price > 0 
                              ? `${selectedSlot.event.price} PLN`
                              : 'Bezpłatne'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-800 flex items-start gap-2">
                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        Po potwierdzeniu rezerwacji otrzymasz email z wszystkimi szczegółami
                        oraz informacją o płatności (jeśli dotyczy).
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedSlot(null);
                          setBookingStep('calendar');
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Anuluj
                      </Button>
                      <EventRegistrationButton
                        eventId={selectedSlot.event.id}
                        className="flex-1"
                        onRegistrationChange={() => {
                          setBookingStep('calendar');
                          setSelectedSlot(null);
                          // Odśwież listę slotów
                          fetchTimeSlots();
                        }}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};