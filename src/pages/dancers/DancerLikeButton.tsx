// src/pages/dancers/DancerLikeButton.tsx
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useGetIdentity, useList } from "@refinedev/core";
import { useEffect, useState } from "react";
import { useDancerLikes } from "./useDancerLikes";
import { cn } from "@/utility";

interface DancerLikeButtonProps {
  targetDancerId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
  className?: string;
}

export const DancerLikeButton = ({
  targetDancerId,
  variant = "default",
  size = "default",
  showText = true,
  className,
}: DancerLikeButtonProps) => {
  const { data: identity } = useGetIdentity();
  const { likeDancer, checkIfLiked, isLiking, useDancerLikesData } = useDancerLikes();
  const [currentDancerId, setCurrentDancerId] = useState<string | null>(null);

  // Pobierz dancer_id na podstawie user_id
  const { data: dancerData } = useList({
    resource: "dancers",
    filters: [
      {
        field: "user_id",
        operator: "eq",
        value: identity?.id || "",
      },
    ],
    queryOptions: {
      enabled: !!identity?.id,
    },
  });

  useEffect(() => {
    if (dancerData?.data && dancerData.data.length > 0) {
      setCurrentDancerId(dancerData.data[0].id);
    }
  }, [dancerData]);

  // Pobierz istniejące polubienia
  const { likedDancers } = useDancerLikesData(currentDancerId);
  
  // Sprawdź czy profil jest już polubiony
  const isLiked = likedDancers.has(targetDancerId);

  const handleLike = () => {
    if (currentDancerId && currentDancerId !== targetDancerId) {
      likeDancer(targetDancerId, currentDancerId);
    }
  };

  const isDisabled = isLiking || !currentDancerId || isLiked || currentDancerId === targetDancerId;

  return (
    <Button
      variant={isLiked ? "default" : variant}
      size={size}
      onClick={handleLike}
      disabled={isDisabled}
      className={cn(
        isLiked && "bg-pink-500 hover:bg-pink-600",
        className
      )}
      title={
        !identity ? "Musisz być zalogowany" : 
        !currentDancerId ? "Musisz mieć profil tancerza" :
        currentDancerId === targetDancerId ? "Nie możesz polubić własnego profilu" :
        isLiked ? "Już polubiłeś ten profil" :
        undefined
      }
    >
      <Heart 
        className={cn(
          "w-4 h-4",
          showText && "mr-2",
          isLiked && "fill-current"
        )} 
      />
      {showText && (isLiked ? "Polubiono" : "Polub")}
    </Button>
  );
};