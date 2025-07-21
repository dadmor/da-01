// src/pages/dancers/useDancerLikes.ts
import { useCreate, useList, useNotification } from "@refinedev/core";
import { useState, useEffect } from "react";
import { Like } from "./dancers";


export const useDancerLikes = () => {
  const [likedDancers, setLikedDancers] = useState<Set<string>>(new Set());
  const { open } = useNotification();
  const { mutate: createLike, isLoading } = useCreate<Like>();

  // Prosta funkcja do polubienia tancerza
  const likeDancer = async (targetDancerId: string, currentDancerId: string) => {
    if (!currentDancerId || !targetDancerId) {
      open?.({
        type: "error",
        message: "Błąd",
        description: "Musisz być zalogowany aby polubić profil",
      });
      return;
    }

    if (currentDancerId === targetDancerId) {
      open?.({
        type: "error",
        message: "Błąd",
        description: "Nie możesz polubić własnego profilu",
      });
      return;
    }

    // Optimistic update
    setLikedDancers(prev => new Set(prev).add(targetDancerId));

    // Po prostu stwórz rekord w tabeli likes
    createLike(
      {
        resource: "likes",
        values: {
          from_dancer_id: currentDancerId,
          to_dancer_id: targetDancerId,
        },
      },
      {
        onSuccess: async () => {
          open?.({
            type: "success",
            message: "Polubiono",
            description: "Profil został polubiony",
          });
        },
        onError: (error: any) => {
          // Jeśli błąd to duplikat (23505), to znaczy że już polubione
          if (error?.code === "23505") {
            open?.({
              type: "info",
              message: "Info",
              description: "Już polubiłeś ten profil",
            });
          } else {
            // Revert optimistic update
            setLikedDancers(prev => {
              const newSet = new Set(prev);
              newSet.delete(targetDancerId);
              return newSet;
            });
            
            open?.({
              type: "error",
              message: "Błąd",
              description: "Nie udało się polubić profilu",
            });
          }
          console.error("Błąd polubienia:", error);
        },
      }
    );
  };

  // Hook do pobierania polubień użytkownika
  const useDancerLikesData = (currentDancerId: string | null) => {
    const { data: likesData } = useList<Like>({
      resource: "likes",
      filters: currentDancerId ? [
        {
          field: "from_dancer_id",
          operator: "eq",
          value: currentDancerId,
        },
      ] : [],
      pagination: {
        mode: "off",
      },
      queryOptions: {
        enabled: !!currentDancerId,
      },
    });

    useEffect(() => {
      if (!currentDancerId || !likesData?.data) return;

      const newLikedDancers = new Set<string>();
      
      // Po prostu dodaj wszystkie to_dancer_id
      likesData.data.forEach((like) => {
        newLikedDancers.add(like.to_dancer_id);
      });

      setLikedDancers(newLikedDancers);
    }, [likesData, currentDancerId]);

    return { likedDancers };
  };

  // Prosta funkcja sprawdzająca
  const checkIfLiked = (targetDancerId: string): boolean => {
    return likedDancers.has(targetDancerId);
  };

  return {
    likeDancer,
    checkIfLiked,
    isLiking: isLoading,
    likedDancers,
    useDancerLikesData,
  };
};