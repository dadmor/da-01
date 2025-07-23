import { Button } from "@/components/ui";
import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useGetIdentity } from "@refinedev/core";
import { supabaseClient } from "@/utility/supabaseClient";
import { toast } from "sonner";
import { cn } from "@/utility";


interface LikeButtonProps {
  targetUserId: string;
  variant?: "default" | "card";
  className?: string;
  onLikeChange?: (isLiked: boolean) => void;
  initialLiked?: boolean;
}

export const LikeButton = ({ 
  targetUserId, 
  variant = "default",
  className = "",
  onLikeChange,
  initialLiked = false
}: LikeButtonProps) => {
  const { data: identity } = useGetIdentity<any>();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);

  // Pobierz stan polubienia przy montowaniu tylko jeśli nie mamy initialLiked
  useEffect(() => {
    if (identity?.id && targetUserId && initialLiked === undefined) {
      checkIfLiked();
    } else {
      setIsLoadingInitial(false);
    }
  }, [identity?.id, targetUserId, initialLiked]);

  const checkIfLiked = async () => {
    if (!identity?.id) return;

    try {
      const { data, error } = await supabaseClient
        .from('likes')
        .select('id')
        .eq('from_user_id', identity.id)
        .eq('to_user_id', targetUserId)
        .single();

      if (!error && data) {
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Zapobiega kliknięciu w kartę

    if (!identity?.id) {
      toast.error("Musisz być zalogowany", {
        description: "Zaloguj się, aby polubić profile",
      });
      return;
    }

    if (identity.id === targetUserId) {
      toast.error("Nie możesz polubić własnego profilu");
      return;
    }

    // Animacja
    if (!isLiked) {
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 600);
    }

    setIsLoading(true);

    try {
      if (isLiked) {
        // Usuń polubienie
        const { error } = await supabaseClient
          .from('likes')
          .delete()
          .eq('from_user_id', identity.id)
          .eq('to_user_id', targetUserId);

        if (error) throw error;

        setIsLiked(false);
        onLikeChange?.(false);

        toast.info("Usunięto polubienie", {
          description: "Profil został usunięty z polubionych",
        });
      } else {
        // Dodaj polubienie
        const { error } = await supabaseClient
          .from('likes')
          .insert({
            from_user_id: identity.id,
            to_user_id: targetUserId,
          });

        if (error) throw error;

        setIsLiked(true);
        onLikeChange?.(true);

        // Sprawdź czy to dopasowanie (wzajemne polubienie)
        const { data: reciprocalLike } = await supabaseClient
          .from('likes')
          .select('id')
          .eq('from_user_id', targetUserId)
          .eq('to_user_id', identity.id)
          .single();

        if (reciprocalLike) {
          toast.success("To dopasowanie! 🎉", {
            description: "Oboje się polubiliście! Możecie teraz rozpocząć konwersację.",
          });
        } else {
          toast.success("Polubiono profil", {
            description: "Profil został dodany do polubionych",
          });
        }
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast.error("Błąd", {
        description: "Nie udało się zaktualizować polubienia",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Nie pokazuj przycisku dla własnego profilu
  if (identity?.id === targetUserId) {
    return null;
  }

  // Styl Tinder dla wariantu "card"
  if (variant === "card") {
    return (
      <button
        className={cn(
          "relative",
          className
        )}
        onClick={handleLike}
        disabled={isLoading || isLoadingInitial}
      >
        {/* Tło serca */}
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
          isLiked 
            ? "bg-gradient-to-br from-pink-500 to-red-500 shadow-xl" 
            : "bg-white shadow-lg border-2 border-gray-200 hover:border-red-300",
          "hover:scale-110 hover:shadow-xl"
        )}>
          <Heart 
            className={cn(
              "w-6 h-6 transition-all duration-300",
              isLiked 
                ? "text-white fill-white" 
                : "text-red-500 hover:fill-red-500",
              showAnimation && "animate-ping"
            )}
          />
        </div>
        
        {/* Animacja pulsowania */}
        {showAnimation && (
          <div className="absolute inset-0 rounded-full animate-ping bg-pink-400/50" />
        )}
        
        {/* Efekt świetlny przy hover */}
        <div className={cn(
          "absolute inset-0 rounded-full opacity-0 hover:opacity-100",
          "bg-gradient-to-br from-pink-400/20 to-red-400/20",
          "transition-opacity duration-300"
        )} />
      </button>
    );
  }

  // Domyślny styl przycisku
  return (
    <Button
      variant={isLiked ? "default" : "outline"}
      onClick={handleLike}
      disabled={isLoading || isLoadingInitial}
      className={className}
    >
      <Heart 
        className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`}
      />
      {isLiked ? "Polubione" : "Polub profil"}
    </Button>
  );
};