// ------ src/pages/profiles/show.tsx ------
import { useGetIdentity } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Edit,
  User,
  MapPin,
  Calendar,
  Award,
  Ruler,
  Mail,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { FlexBox, GridBox } from "@/components/shared";
import { Lead } from "@/components/reader";
import { Badge, Button, Separator } from "@/components/ui";
import { SubPage } from "@/components/layout";
import { supabaseClient } from "@/utility/supabaseClient";
import { useEffect, useState } from "react";

interface UserRecord {
  id: string;
  email: string;
  name: string;
  bio?: string;
  profile_photo_url?: string;
  birth_date?: string;
  height?: number;
  location_lat?: number;
  location_lng?: number;
  city?: string;
  search_radius_km?: number;
  is_trainer?: boolean;
  is_school_owner?: boolean;
  is_verified?: boolean;
  is_active?: boolean;
  is_banned?: boolean;
  show_age?: boolean;
  show_exact_location?: boolean;
  visibility?: string;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
}

export const ProfileShow = () => {
  const { data: identity, isLoading: isLoadingIdentity } = useGetIdentity<any>();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserRecord | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pobierz dane użytkownika
  useEffect(() => {
    if (identity?.id) {
      setIsLoadingUser(true);
      setError(null);
      
      supabaseClient
        .from('users')
        .select('*')
        .eq('id', identity.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching user:', error);
            setError('Nie udało się pobrać danych użytkownika');
          } else if (data) {
            setUserData(data);
          }
          setIsLoadingUser(false);
        });
    }
  }, [identity?.id]);

  // Obsługa stanów ładowania
  if (isLoadingIdentity) {
    return (
      <SubPage>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Ładowanie danych użytkownika...</p>
          </div>
        </div>
      </SubPage>
    );
  }

  if (!identity?.id) {
    return (
      <SubPage>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 text-lg">Nie można załadować danych użytkownika</p>
            <p className="text-muted-foreground mt-2">Spróbuj odświeżyć stronę</p>
          </div>
        </div>
      </SubPage>
    );
  }

  if (isLoadingUser) {
    return (
      <SubPage>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Ładowanie profilu...</p>
          </div>
        </div>
      </SubPage>
    );
  }

  if (error || !userData) {
    return (
      <SubPage>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 text-lg">{error || 'Nie znaleziono profilu'}</p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              Odśwież stronę
            </Button>
          </div>
        </div>
      </SubPage>
    );
  }

  // Oblicz wiek
  const age = userData.birth_date 
    ? new Date().getFullYear() - new Date(userData.birth_date).getFullYear()
    : null;

  return (
    <SubPage>
      <FlexBox>
        <Lead title="Mój Profil" description="Podgląd Twojego profilu" />
        <Button onClick={() => navigate("/profiles/edit")}>
          <Edit className="w-4 h-4 mr-2" />
          Edytuj profil
        </Button>
      </FlexBox>

      <GridBox>
        {/* Główne informacje */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informacje podstawowe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Imię i nazwisko</p>
                  <p className="text-lg">{userData.name}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-lg flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {userData.email}
                  </p>
                </div>

                {userData.birth_date && age && (
                  <div>
                    <p className="text-sm font-medium">Wiek</p>
                    <p className="text-lg flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {age} lat
                    </p>
                  </div>
                )}

                {userData.height && (
                  <div>
                    <p className="text-sm font-medium">Wzrost</p>
                    <p className="text-lg flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      {userData.height} cm
                    </p>
                  </div>
                )}
              </div>

              {userData.bio && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">O mnie</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {userData.bio}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex flex-wrap gap-2">
                {userData.is_trainer && (
                  <Badge variant="secondary">
                    <Award className="w-3 h-3 mr-1" />
                    Trener
                  </Badge>
                )}
                {userData.is_school_owner && (
                  <Badge variant="secondary">
                    <Award className="w-3 h-3 mr-1" />
                    Właściciel szkoły
                  </Badge>
                )}
                {userData.is_verified && (
                  <Badge variant="default">
                    <Shield className="w-3 h-3 mr-1" />
                    Zweryfikowany
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Lokalizacja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userData.city && (
                <div>
                  <p className="text-sm font-medium">Miasto</p>
                  <p className="text-lg">{userData.city}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Promień wyszukiwania</p>
                <p className="text-lg">{userData.search_radius_km || 50} km</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel boczny */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ustawienia prywatności</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Widoczność profilu</span>
                <Badge variant="outline" className="capitalize">
                  {userData.visibility === "public"
                    ? "Publiczny"
                    : userData.visibility === "friends"
                    ? "Znajomi"
                    : "Prywatny"}
                </Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  {userData.show_age ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3" />
                  )}
                  Pokazuj wiek
                </span>
                <span className="text-sm font-medium">
                  {userData.show_age ? "Tak" : "Nie"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  {userData.show_exact_location ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3" />
                  )}
                  Dokładna lokalizacja
                </span>
                <span className="text-sm font-medium">
                  {userData.show_exact_location ? "Tak" : "Nie"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status konta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge variant={userData.is_active ? "default" : "secondary"}>
                  {userData.is_active ? "Aktywny" : "Nieaktywny"}
                </Badge>
              </div>

              <Separator />

              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  Utworzono:{" "}
                  {new Date(userData.created_at).toLocaleDateString("pl-PL")}
                </p>
                <p>
                  Ostatnia aktualizacja:{" "}
                  {new Date(userData.updated_at).toLocaleDateString("pl-PL")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </GridBox>
    </SubPage>
  );
};