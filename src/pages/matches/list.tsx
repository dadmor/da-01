import { useState, useEffect } from "react";
import { useGetIdentity, useNavigation } from "@refinedev/core";
import { supabaseClient } from "@/utility/supabaseClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge, Button } from "@/components/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  Users, 
  MessageCircle, 
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  UserPlus,
  HeartHandshake
} from "lucide-react";
import { SubPage } from "@/components/layout";
import { Lead } from "@/components/reader";
import { FlexBox } from "@/components/shared";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  name: string;
  profile_photo_url?: string;
  city?: string;
  age?: number;
  bio?: string;
  is_verified?: boolean;
  created_at?: string;
}

interface Like {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
  from_user?: UserProfile;
  to_user?: UserProfile;
}

export const MatchesList = () => {
  const { data: identity } = useGetIdentity<any>();
  const { show } = useNavigation();
  
  const [matches, setMatches] = useState<Like[]>([]);
  const [myLikes, setMyLikes] = useState<Like[]>([]);
  const [likesMe, setLikesMe] = useState<Like[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("matches");

  useEffect(() => {
    if (identity?.id) {
      fetchAllData();
    }
  }, [identity?.id]);

  const fetchAllData = async () => {
    if (!identity?.id) return;
    
    setIsLoading(true);
    try {
      // Pobierz moje polubienia
      const { data: myLikesData, error: myLikesError } = await supabaseClient
        .from('likes')
        .select(`
          *,
          to_user:v_public_dancers!likes_to_user_id_fkey (
            id,
            name,
            profile_photo_url,
            city,
            age,
            bio,
            is_verified
          )
        `)
        .eq('from_user_id', identity.id);

      if (myLikesError) throw myLikesError;

      // Pobierz kto mnie polubił
      const { data: likesMeData, error: likesMeError } = await supabaseClient
        .from('likes')
        .select(`
          *,
          from_user:v_public_dancers!likes_from_user_id_fkey (
            id,
            name,
            profile_photo_url,
            city,
            age,
            bio,
            is_verified
          )
        `)
        .eq('to_user_id', identity.id);

      if (likesMeError) throw likesMeError;

      // Znajdź dopasowania (wzajemne polubienia)
      const matchesData: Like[] = [];
      const myLikesFiltered: Like[] = [];
      const likesMeFiltered: Like[] = [];

      // Sprawdź każde moje polubienie
      myLikesData?.forEach(myLike => {
        const isMatch = likesMeData?.some(
          likeMe => likeMe.from_user_id === myLike.to_user_id
        );
        
        if (isMatch) {
          matchesData.push(myLike);
        } else {
          myLikesFiltered.push(myLike);
        }
      });

      // Filtruj polubienia mnie (usuń te które są już w dopasowaniach)
      likesMeData?.forEach(likeMe => {
        const isMatch = matchesData.some(
          match => match.to_user_id === likeMe.from_user_id
        );
        
        if (!isMatch) {
          likesMeFiltered.push(likeMe);
        }
      });

      setMatches(matchesData);
      setMyLikes(myLikesFiltered);
      setLikesMe(likesMeFiltered);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Błąd pobierania danych");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLike = async (likeId: string) => {
    try {
      const { error } = await supabaseClient
        .from('likes')
        .delete()
        .eq('id', likeId);

      if (error) throw error;

      toast.success("Usunięto polubienie");
      fetchAllData(); // Odśwież dane
    } catch (error) {
      console.error('Error removing like:', error);
      toast.error("Błąd usuwania polubienia");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Dzisiaj";
    if (diffDays === 1) return "Wczoraj";
    if (diffDays < 7) return `${diffDays} dni temu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tyg. temu`;
    return `${Math.floor(diffDays / 30)} mies. temu`;
  };

  const UserCard = ({ user, likeDate, likeId, showRemove = false }: { 
    user: UserProfile | null, 
    likeDate: string,
    likeId: string,
    showRemove?: boolean 
  }) => {
    if (!user) return null;

    return (
      <Card 
        className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
        onClick={() => show("v_public_dancers", user.id)}
      >
        <div className="flex items-center gap-4 p-4">
          <Avatar className="h-16 w-16 flex-shrink-0">
            <AvatarImage src={user.profile_photo_url || undefined} />
            <AvatarFallback className="text-lg bg-gradient-to-br from-pink-400 to-purple-400 text-white">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base truncate">
                {user.name}
              </h3>
              {user.is_verified && (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="w-3 h-3" />
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {user.age && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {user.age} lat
                </span>
              )}
              {user.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {user.city}
                </span>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(likeDate)}
            </p>
          </div>
          
          <div className="flex gap-2">
            {activeTab === "matches" && (
              <Button
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.info("Funkcja czatu będzie dostępna wkrótce");
                }}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            )}
            
            {showRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveLike(likeId);
                }}
              >
                <Heart className="w-4 h-4 fill-current" />
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              className="group-hover:bg-accent"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const EmptyState = ({ icon: Icon, title, description }: {
    icon: any,
    title: string,
    description: string
  }) => (
    <Card className="p-12 text-center border-dashed">
      <Icon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );

  if (isLoading) {
    return (
      <SubPage>
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </SubPage>
    );
  }

  return (
    <SubPage>
      <FlexBox>
        <Lead
          title="Polubienia i dopasowania"
          description="Zarządzaj swoimi połączeniami z innymi tancerzami"
        />
      </FlexBox>

      <div className="flex gap-4 mb-6">
        <Badge variant="outline" className="text-sm">
          <HeartHandshake className="w-3 h-3 mr-1" />
          {matches.length} dopasowań
        </Badge>
        <Badge variant="outline" className="text-sm">
          <Heart className="w-3 h-3 mr-1" />
          {myLikes.length} polubionych
        </Badge>
        <Badge variant="outline" className="text-sm">
          <UserPlus className="w-3 h-3 mr-1" />
          {likesMe.length} polubień
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matches" className="gap-2">
            <HeartHandshake className="w-4 h-4" />
            Dopasowania ({matches.length})
          </TabsTrigger>
          <TabsTrigger value="my-likes" className="gap-2">
            <Heart className="w-4 h-4" />
            Moje polubienia ({myLikes.length})
          </TabsTrigger>
          <TabsTrigger value="likes-me" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Polubili mnie ({likesMe.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="mt-6 space-y-3">
          {matches.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                🎉 Gratulacje! Masz wzajemne dopasowania. Możesz rozpocząć rozmowę.
              </p>
              {matches.map((match) => (
                <UserCard 
                  key={match.id} 
                  user={match.to_user as UserProfile} 
                  likeDate={match.created_at}
                  likeId={match.id}
                />
              ))}
            </>
          ) : (
            <EmptyState
              icon={HeartHandshake}
              title="Brak dopasowań"
              description="Gdy ktoś kogo polubiłeś również Cię polubi, pojawi się tutaj jako dopasowanie"
            />
          )}
        </TabsContent>

        <TabsContent value="my-likes" className="mt-6 space-y-3">
          {myLikes.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Profile które polubiłeś. Czekaj aż odwzajemnią polubienie!
              </p>
              {myLikes.map((like) => (
                <UserCard 
                  key={like.id} 
                  user={like.to_user as UserProfile} 
                  likeDate={like.created_at}
                  likeId={like.id}
                  showRemove={true}
                />
              ))}
            </>
          ) : (
            <EmptyState
              icon={Heart}
              title="Brak polubionych profili"
              description="Przeglądaj profile i polub tych, którzy Ci się spodobają"
            />
          )}
        </TabsContent>

        <TabsContent value="likes-me" className="mt-6 space-y-3">
          {likesMe.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Te osoby czekają na Twoje polubienie. Polub je, aby utworzyć dopasowanie!
              </p>
              {likesMe.map((like) => (
                <UserCard 
                  key={like.id} 
                  user={like.from_user as UserProfile} 
                  likeDate={like.created_at}
                  likeId={like.id}
                />
              ))}
            </>
          ) : (
            <EmptyState
              icon={UserPlus}
              title="Nikt jeszcze Cię nie polubił"
              description="Uzupełnij swój profil i dodaj zdjęcia, aby zwiększyć szanse na polubienia"
            />
          )}
        </TabsContent>
      </Tabs>
    </SubPage>
  );
};