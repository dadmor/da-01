// src/pages/trainers/list.tsx
import { useTable, useNavigation } from "@refinedev/core";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Star,
  Award,
  Search,
  Filter,
  Clock,
  ChevronRight,
  CalendarCheck,
  Users,
} from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { PaginationSwith } from "@/components/navigation";
import { Lead } from "@/components/reader";
import { useLoading } from "@/utility";
import { Badge, Button, Input } from "@/components/ui";
import { SubPage } from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/utility/supabaseClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DanceStyle {
  style_name: string;
}

interface Trainer {
  id: string;
  name: string;
  email: string;
  bio?: string;
  profile_photo_url?: string;
  city?: string;
  is_trainer: boolean;
  is_verified: boolean;
  created_at: string;
  // Te dane będziemy pobierać osobno
  total_events?: number;
  average_rating?: number;
  review_count?: number;
  teaching_styles?: string[];
}

interface TrainerStats {
  trainer_id: string;
  name: string;
  total_events: number;
  unique_students: number;
  avg_participants: number;
  total_revenue: number;
  review_count: number;
  average_rating: number;
  teaching_styles: string[];
}

export const TrainersList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [styleFilter, setStyleFilter] = useState<string>("all");
  const [trainersStats, setTrainersStats] = useState<Record<string, TrainerStats>>({});
  const [priceRanges, setPriceRanges] = useState<Record<string, { min: number; max: number }>>({});

  const {
    tableQuery: { data, isLoading, isError },
    current,
    setCurrent,
    pageSize,
    setFilters,
  } = useTable({
    resource: "users",
    pagination: {
      pageSize: 12,
    },
    filters: {
      initial: [
        {
          field: "is_trainer",
          operator: "eq",
          value: true,
        },
      ],
    },
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
  });

  const { show, create } = useNavigation();

  // Pobierz statystyki trenerów
  useEffect(() => {
    const fetchTrainerStats = async () => {
      if (!data?.data) return;
      
      const trainerIds = (data.data as Trainer[]).map(t => t.id);
      console.log('Fetching stats for trainers:', trainerIds);
      
      try {
        // Pobierz statystyki z widoku
        const { data: stats, error } = await supabaseClient
          .from('v_trainer_stats')
          .select('*')
          .in('trainer_id', trainerIds);

        console.log('Trainer stats response:', { stats, error });
        console.log('Detailed stats data:', stats?.map(s => ({
          trainer_id: s.trainer_id,
          name: s.name,
          total_events: s.total_events,
          unique_students: s.unique_students,
          average_rating: s.average_rating,
          review_count: s.review_count
        })));

        if (error) {
          console.error('Error fetching trainer stats:', error);
        }

        if (!error && stats) {
          const statsMap = stats.reduce((acc, stat) => {
            acc[stat.trainer_id] = stat;
            return acc;
          }, {} as Record<string, TrainerStats>);
          console.log('Stats map:', statsMap);
          setTrainersStats(statsMap);
        }

        // Pobierz zakresy cen dla każdego trenera (tylko lekcje i warsztaty)
        console.log('Fetching price ranges for trainers...');
        
        // Sprawdźmy tylko lekcje i warsztaty
        const { data: allEvents, error: allEventsError } = await supabaseClient
          .from('events')
          .select('id, organizer_id, price, status, title, event_type')
          .in('organizer_id', trainerIds)
          .in('event_type', ['lesson', 'workshop']); // TYLKO lekcje i warsztaty
          
        console.log('Lesson and workshop events for trainers:', allEvents);
        
        const priceMap: Record<string, { min: number; max: number }> = {};
        
        if (!allEventsError && allEvents) {
          // Grupuj wydarzenia po organizatorze
          trainerIds.forEach(trainerId => {
            const trainerEvents = allEvents.filter(e => e.organizer_id === trainerId);
            console.log(`Lessons/workshops for trainer ${trainerId}:`, trainerEvents);
            
            // Filtruj tylko te z ceną > 0
            const eventsWithPrice = trainerEvents.filter(e => e.price > 0);
            console.log(`Lessons/workshops with price > 0 for trainer ${trainerId}:`, eventsWithPrice);
            
            if (eventsWithPrice.length > 0) {
              const prices = eventsWithPrice.map(e => e.price);
              priceMap[trainerId] = {
                min: Math.min(...prices),
                max: Math.max(...prices)
              };
            }
          });
        }
        
        console.log('Final price map:', priceMap);
        setPriceRanges(priceMap);

      } catch (error) {
        console.error('Error fetching trainer stats:', error);
      }
    };

    fetchTrainerStats();
  }, [data?.data]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    updateFilters(value, cityFilter, styleFilter);
  };

  const handleCityFilter = (value: string) => {
    setCityFilter(value);
    updateFilters(searchQuery, value, styleFilter);
  };

  const handleStyleFilter = (value: string) => {
    setStyleFilter(value);
    updateFilters(searchQuery, cityFilter, value);
  };

  const updateFilters = (search: string, city: string, style: string) => {
    const filters: any[] = [];

    if (city !== "all") {
      filters.push({
        field: "city",
        operator: "eq",
        value: city,
      });
    }

    if (style !== "all") {
      // To nie zadziała bezpośrednio na tabeli users
      // Ale możemy to zostawić jako placeholder
      filters.push({
        field: "teaching_styles",
        operator: "contains" as any,
        value: style,
      });
    }

    if (search) {
      filters.push({
        field: "name",
        operator: "contains" as any,
        value: search,
      });
    }

    // Dodaj filtr is_trainer zawsze
    filters.push({
      field: "is_trainer",
      operator: "eq",
      value: true,
    });

    setFilters(filters);
  };

  const init = useLoading({ isLoading, isError });
  if (init) return init;

  const trainers = (data?.data as Trainer[]) || [];

  // Funkcja do pobierania unikalnych miast
  const uniqueCities = Array.from(new Set(trainers.map(t => t.city).filter(Boolean)));

  // Pobierz wszystkie unikalne style tańca
  const allStyles = new Set<string>();
  Object.values(trainersStats).forEach(stat => {
    if (stat.teaching_styles) {
      stat.teaching_styles.forEach(style => allStyles.add(style));
    }
  });

  // Funkcja do określenia zakresu cenowego
  const getPriceRange = (trainerId: string) => {
    const range = priceRanges[trainerId];
    if (range) {
      if (range.min === range.max) {
        return `${range.min} PLN`;
      }
      return `${range.min}-${range.max} PLN`;
    }
    return "Free";
  };

  // Filtruj trenerów po stylach (jeśli wybrany)
  let filteredTrainers = trainers;
  if (styleFilter !== "all") {
    filteredTrainers = trainers.filter(trainer => {
      const stats = trainersStats[trainer.id];
      return stats?.teaching_styles?.includes(styleFilter);
    });
  }

  return (
    <SubPage>
      <FlexBox>
        <Lead
          title="Znajdź trenera"
          description="Umów się na zajęcia taneczne z najlepszymi instruktorami"
        />
      </FlexBox>

      <FlexBox>
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Szukaj trenera..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={cityFilter} onValueChange={handleCityFilter}>
            <SelectTrigger className="w-[140px]">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Miasto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie miasta</SelectItem>
              {uniqueCities.map(city => (
                <SelectItem key={city} value={city!}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={styleFilter} onValueChange={handleStyleFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Styl tańca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie style</SelectItem>
              {Array.from(allStyles).sort().map(style => (
                <SelectItem key={style} value={style}>{style}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Badge variant="outline">
          <Users className="w-3 h-3 mr-1" />
          {filteredTrainers.length} trenerów
        </Badge>
      </FlexBox>

      <GridBox variant="1-2-3">
        {filteredTrainers.map((trainer) => {
          const stats = trainersStats[trainer.id];
          const teachingStyles = stats?.teaching_styles || [];
          
          console.log(`Rendering trainer ${trainer.name}:`, {
            id: trainer.id,
            stats: stats,
            hasStats: !!stats,
            totalEvents: stats?.total_events,
            uniqueStudents: stats?.unique_students
          });
          
          return (
            <Card 
              key={trainer.id} 
              className="group overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="p-0">
                {/* Górna sekcja z avatarem i podstawowymi info */}
                <div className="p-6 pb-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 ring-2 ring-offset-2 ring-gray-200">
                      <AvatarImage src={trainer.profile_photo_url} />
                      <AvatarFallback className="text-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {trainer.name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">
                          {trainer.name}
                        </h3>
                        {trainer.is_verified && (
                          <Award className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      {trainer.city && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {trainer.city}
                        </p>
                      )}

                      {/* Ocena */}
                      {stats?.average_rating && stats.review_count > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{Number(stats.average_rating).toFixed(1)}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            ({stats.review_count} {stats.review_count === 1 ? 'opinia' : 'opinii'})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {trainer.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-3">
                      {trainer.bio}
                    </p>
                  )}

                  {/* Style tańca */}
                  {teachingStyles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {teachingStyles.slice(0, 3).map((style: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {style}
                        </Badge>
                      ))}
                      {teachingStyles.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{teachingStyles.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Statystyki */}
                <div className="grid grid-cols-3 gap-px bg-gray-200">
                  <div className="bg-gray-50 p-3 text-center">
                    <p className="text-2xl font-semibold text-primary">
                      {stats?.total_events || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">wydarzeń</p>
                  </div>
                  <div className="bg-gray-50 p-3 text-center">
                    <p className="text-2xl font-semibold text-primary">
                      {stats?.unique_students || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">uczniów</p>
                  </div>
                  <div className="bg-gray-50 p-3 text-center">
                    <p className="text-lg font-semibold text-primary">
                      {getPriceRange(trainer.id)}
                    </p>
                    <p className="text-xs text-muted-foreground">cena</p>
                  </div>
                </div>

                {/* Footer z akcjami */}
                <div className="p-4 bg-white border-t">
                  <div className="flex items-center justify-between mb-3">
                    {stats && stats.total_events > 0 ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">
                          Aktywny trener
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Nowy trener
                        </span>
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  
                  <Button 
                    className="w-full group"
                    onClick={() => window.location.href = `/trainers/${trainer.id}/booking`}
                  >
                    <CalendarCheck className="w-4 h-4 mr-2" />
                    Umów zajęcia
                    <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </GridBox>

      {filteredTrainers.length === 0 && (
        <Card className="p-12 text-center border-dashed">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Nie znaleziono trenerów
          </h3>
          <p className="text-muted-foreground">
            {searchQuery || cityFilter !== "all" || styleFilter !== "all"
              ? "Spróbuj zmienić kryteria wyszukiwania" 
              : "Brak dostępnych trenerów w tym momencie"}
          </p>
        </Card>
      )}

      <PaginationSwith
        current={current}
        pageSize={pageSize}
        total={filteredTrainers.length}
        setCurrent={setCurrent}
        itemName="trenerów"
      />
    </SubPage>
  );
};