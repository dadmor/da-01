import { useGetIdentity } from "@refinedev/core";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "lucide-react";
import { UserData } from "@/types/userTypes";


interface UserProfileProps {
  className?: string;
}

export const UserMicroProfile: React.FC<UserProfileProps> = ({ className }) => {
  const { data: user, isLoading, error } = useGetIdentity<UserData>();

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-3 p-3 ${className}`}>
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center space-x-3 p-3 text-destructive ${className}`}
      >
        <User className="h-6 w-6" />
        <div className="text-sm">
          <div className="font-medium">Błąd danych</div>
          <div className="text-xs opacity-70">Nie można pobrać profilu</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className={`flex items-center space-x-3 p-3 text-muted-foreground ${className}`}
      >
        <User className="h-6 w-6" />
        <div className="text-sm">
          <div className="font-medium">Brak danych</div>
          <div className="text-xs opacity-70">Użytkownik nieznany</div>
        </div>
      </div>
    );
  }

  // Wyciągnij inicjały z imienia i nazwiska lub email
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const displayName = user.name || user.email || "Użytkownik";
  const initials = getInitials(user.name, user.email);

  // Rola znajduje się w user_metadata
  const role = user.user_metadata?.role;

  return (
    <div className={`flex items-center space-x-3 p-3 ${className}`}>
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.avatar} alt={displayName} />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <div className="font-medium text-sm truncate" title={displayName}>
          {displayName}
        </div>
        {user.email && (
          <div
            className="text-xs text-muted-foreground truncate"
            title={user.email}
          >
            {user.email}
          </div>
        )}
        {role && (
          <div className="text-xs text-muted-foreground truncate" title={role}>
            Rola: {role}
          </div>
        )}
      </div>
    </div>
  );
};
