// src/components/events/EventRegistrationButton.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabaseClient } from "@/utility/supabaseClient";
import { useGetIdentity, useInvalidate } from "@refinedev/core";

interface EventRegistrationButtonProps {
  eventId: string;
  onRegistrationChange?: (isRegistered: boolean, participantCount: number) => void;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}

export const EventRegistrationButton = ({
  eventId,
  onRegistrationChange,
  className,
  variant,
  size = "default",
  disabled = false,
}: EventRegistrationButtonProps) => {
  const { data: identity } = useGetIdentity<any>();
  const invalidate = useInvalidate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [userParticipation, setUserParticipation] = useState<any>(null);
  const [participantCount, setParticipantCount] = useState(0);

  // Sprawdź czy użytkownik jest zapisany i pobierz liczbę uczestników
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (!eventId) return;

      try {
        // Sprawdź status użytkownika
        if (identity?.id) {
          const { data: participation, error: participationError } = await supabaseClient
            .from('event_participants')
            .select('*')
            .eq('event_id', eventId)
            .eq('user_id', identity.id)
            .maybeSingle();

          if (!participationError) {
            setUserParticipation(participation);
          }
        }

        // Pobierz liczbę uczestników
        const { count, error: countError } = await supabaseClient
          .from('event_participants')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .in('status', ['registered', 'confirmed', 'attended']);

        if (!countError && count !== null) {
          setParticipantCount(count);
        }
      } catch (error) {
        console.error('Error checking registration status:', error);
      }
    };

    checkRegistrationStatus();
  }, [eventId, identity?.id]);

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

        const newCount = participantCount - 1;
        setUserParticipation(null);
        setParticipantCount(newCount);
        
        toast.success("Wypisano z wydarzenia");
        
        // Callback
        onRegistrationChange?.(false, newCount);
        
        // Odśwież dane przez refine
        invalidate({
          resource: "events",
          invalidates: ["detail", "list"],
          id: eventId,
        });
        invalidate({
          resource: "v_events_with_counts",
          invalidates: ["list"],
        });
      } else {
        // Zapisz się
        const { data, error } = await supabaseClient
          .from('event_participants')
          .insert({
            event_id: eventId,
            user_id: identity.id,
            status: 'registered'
          })
          .select()
          .single();

        if (error) {
          // Jeśli błąd duplikatu, sprawdź ponownie stan
          if (error.code === '23505') {
            const { data: existingParticipation } = await supabaseClient
              .from('event_participants')
              .select('*')
              .eq('event_id', eventId)
              .eq('user_id', identity.id)
              .maybeSingle();
              
            if (existingParticipation) {
              setUserParticipation(existingParticipation);
              toast.error("Już jesteś zapisany na to wydarzenie");
              return;
            }
          }
          throw error;
        }

        const newCount = participantCount + 1;
        setUserParticipation(data);
        setParticipantCount(newCount);
        
        toast.success("Zapisano na wydarzenie!", {
          description: "Otrzymasz potwierdzenie na email",
        });
        
        // Callback
        onRegistrationChange?.(true, newCount);
        
        // Odśwież dane przez refine
        invalidate({
          resource: "events",
          invalidates: ["detail", "list"],
          id: eventId,
        });
        invalidate({
          resource: "v_events_with_counts",
          invalidates: ["list"],
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

  return (
    <Button
      className={className}
      variant={userParticipation ? "outline" : (variant || "default")}
      size={size}
      disabled={disabled || isRegistering}
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
  );
};