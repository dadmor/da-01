// src/pages/dancers/list.tsx
import { useTable, useNavigation, useGetIdentity, useList } from "@refinedev/core";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { 
  Eye, 
  MapPin, 
  Music, 
  Search, 
  Trophy, 
  Users,
  Sparkles,
  Filter
} from "lucide-react";
import { FlexBox } from "@/components/shared";
import { PaginationSwitch } from "@/components/navigation";
import { useLoading } from "@/utility";
import { 
  Badge, 
  Button, 
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { DancerLikeButton } from "./DancerLikeButton";
import { useState, useEffect, useMemo } from "react";
import { Dancer, UserIdentity, DanceStyle } from "./dancers";
import { cn } from "@/utility";

export const DancersList = () => {
  const { data: identity } = useGetIdentity<UserIdentity>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string>("all");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pobierz listę wszystkich styli tańca
  const { data: stylesData } = useList<DanceStyle>({
    resource: "dance_styles",
    filters: [
      {
        field: "is_active",
        operator: "eq",
        value: true,
      },
    ],
    sorters: [
      {
        field: "name",
        order: "asc",
      },
    ],
    pagination: {
      mode: "off",
    },
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Buduj filtry dynamicznie
  const filters = useMemo(() => {
    const baseFilters: any[] = [];
    
    // Filtr wyszukiwania po imieniu
    if (debouncedSearchTerm) {
      baseFilters.push({
        field: "name",
        operator: "contains",
        value: debouncedSearchTerm,
      });
    }
    
    return baseFilters;
  }, [debouncedSearchTerm]);

  const {
    tableQuery: { data, isLoading, isError },
    current,
    setCurrent,
    pageSize,
    filters: tableFilters,
    setFilters,
  } = useTable<Dancer>({
    resource: "dancers",
    meta: {
      select: '*, dancer_dance_styles(skill_level, dance_styles(id, name), is_teaching)'
    },
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
    pagination: {
      pageSize: 12,
    },
  });

  // Aktualizuj filtry gdy się zmienią
  useEffect(() => {
    setFilters(filters);
  }, [filters, setFilters]);

  // Osobny efekt dla filtrowania po stylu tańca
  const filteredDancers = useMemo(() => {
    if (!data?.data) return [];
    
    let filtered = [...data.data];
    
    // Filtruj po stylu tańca lokalnie
    if (selectedStyle && selectedStyle !== "all") {
      filtered = filtered.filter(dancer => 
        dancer.dancer_dance_styles?.some(ds => 
          ds.dance_styles?.id === selectedStyle
        )
      );
    }
    
    return filtered;
  }, [data?.data, selectedStyle]);
  
  const { show } = useNavigation();
  const init = useLoading({ isLoading, isError });

  if (init) return init;

  // Funkcja do obliczania wieku z daty urodzenia
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Funkcja do mapowania poziomu umiejętności
  const getSkillLevelLabel = (level: string) => {
    const levels: Record<string, string> = {
      beginner: 'Początkujący',
      intermediate: 'Średniozaawansowany',
      advanced: 'Zaawansowany',
      professional: 'Profesjonalny'
    };
    return levels[level] || level;
  };

  const dancers = filteredDancers;
  const danceStyles = stylesData?.data || [];

  // Grupuj style tańca po kategorii
  const stylesByCategory = danceStyles.reduce((acc, style) => {
    const category = style.category || 'Inne';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(style);
    return acc;
  }, {} as Record<string, DanceStyle[]>);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm">
                <Users className="w-12 h-12 md:w-16 md:h-16" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Znajdź swojego partnera tanecznego
            </h1>
            
            <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Przeglądaj profile tancerzy, odkryj instruktorów i dołącz do społeczności 
              pasjonatów tańca w Twojej okolicy
            </p>

            {/* Search Section */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8">
              <div className="flex flex-col gap-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                  <Input
                    placeholder="Szukaj po imieniu tancerza..."
                    className="pl-12 h-12 md:h-14 text-base md:text-lg bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Style Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger className="h-12 md:h-14 bg-white/20 border-white/30 text-white">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        <SelectValue placeholder="Wybierz styl tańca" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie style</SelectItem>
                      {Object.entries(stylesByCategory).map(([category, styles]) => (
                        <div key={category}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {category}
                          </div>
                          {styles.map((style) => (
                            <SelectItem key={style.id} value={style.id}>
                              {style.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="secondary"
                    size="lg"
                    className="h-12 md:h-14"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Więcej filtrów
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold">{dancers.length}</div>
                    <div className="text-sm text-white/80">Znalezionych</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold">
                      {dancers.filter(d => d.dancer_dance_styles?.some(ds => ds.is_teaching)).length}
                    </div>
                    <div className="text-sm text-white/80">Instruktorów</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold">{danceStyles.length}</div>
                    <div className="text-sm text-white/80">Styli tańca</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold">
                      <Sparkles className="w-6 h-6 md:w-8 md:h-8 mx-auto" />
                    </div>
                    <div className="text-sm text-white/80">Nowe dopasowania</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
        {/* Active Filters */}
        {(searchTerm || (selectedStyle && selectedStyle !== "all")) && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Aktywne filtry:</span>
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Imię: {searchTerm}
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedStyle && selectedStyle !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Styl: {danceStyles.find(s => s.id === selectedStyle)?.name}
                <button
                  onClick={() => setSelectedStyle("all")}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedStyle("all");
              }}
            >
              Wyczyść filtry
            </Button>
          </div>
        )}

        {/* Dancers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {dancers.map((dancer) => {
            const age = calculateAge(dancer.birth_date);
            const danceStyles = dancer.dancer_dance_styles?.map((ds) => ({
              name: ds.dance_styles?.name,
              level: ds.skill_level,
              isTeaching: ds.is_teaching
            })).filter((ds) => ds.name) || [];
            
            // Nie pokazuj własnego profilu
            const isOwnProfile = identity?.id === dancer.user_id;
            if (isOwnProfile) return null;
            
            return (
              <Card key={dancer.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                <CardHeader className="p-0">
                  <div className="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden">
                    <img
                      src={dancer.profile_photo_url || "/placeholder-dancer.jpg"}
                      alt={dancer.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-dancer.jpg";
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 md:p-5">
                      <h3 className="text-xl md:text-2xl font-bold text-white">
                        {dancer.name}{dancer.show_age !== false && age ? `, ${age}` : ""}
                      </h3>
                      {dancer.show_exact_location !== false && (
                        <p className="text-white/90 flex items-center gap-1.5 mt-1 text-sm md:text-base">
                          <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                          <span className="truncate">
                            {dancer.city || dancer.location_address || "Nieznane"}
                          </span>
                        </p>
                      )}
                      {/* Instructor Badge */}
                      {dancer.dancer_dance_styles?.some(ds => ds.is_teaching) && (
                        <Badge 
                          variant="default" 
                          className="bg-green-600 text-white absolute top-4 right-4"
                        >
                          <Trophy className="w-3 h-3 mr-1" />
                          Instruktor
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 md:p-5">
                  {/* Dance Styles */}
                  {danceStyles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {danceStyles.slice(0, 3).map((style, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs md:text-sm py-0.5 px-2">
                          <Music className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />
                          {style.name}
                          {style.isTeaching && (
                            <span className="ml-1 text-green-600">•</span>
                          )}
                        </Badge>
                      ))}
                      {danceStyles.length > 3 && (
                        <Badge variant="outline" className="text-xs md:text-sm py-0.5 px-2">
                          +{danceStyles.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Bio */}
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {dancer.bio || "Brak opisu profilu"}
                  </p>
                  
                  {/* Additional Info */}
                  {dancer.search_radius_km && (
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Zasięg: {dancer.search_radius_km} km
                    </p>
                  )}
                </CardContent>
                
                <CardFooter className="p-4 md:p-5 pt-0">
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 md:h-9 text-xs md:text-sm"
                      onClick={() => show("dancers", dancer.id)}
                    >
                      <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" />
                      Profil
                    </Button>
                    {identity && (
                      <DancerLikeButton
                        targetDancerId={dancer.id}
                        className="flex-1 h-8 md:h-9 text-xs md:text-sm"
                        size="sm"
                      />
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          }).filter(Boolean)}
        </div>

        {/* Empty State */}
        {dancers.length === 0 && (
          <div className="text-center py-16 md:py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-muted rounded-full mb-4">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nie znaleziono tancerzy</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Spróbuj zmienić kryteria wyszukiwania lub sprawdź później
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedStyle("all");
              }}
            >
              Wyczyść filtry
            </Button>
          </div>
        )}

        {/* Pagination */}
        {data && data.total > pageSize && (
          <div className="mt-8 md:mt-12">
            <PaginationSwitch
              current={current}
              pageSize={pageSize}
              total={data.total || 0}
              setCurrent={setCurrent}
              itemName="tancerzy"
            />
          </div>
        )}
      </div>
    </div>
  );
};