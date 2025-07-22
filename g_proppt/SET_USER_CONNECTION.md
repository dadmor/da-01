-- Trigger automatycznie tworzący rekord w tabeli users po rejestracji
CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, user_type, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        'dancer', -- domyślnie tancerz, można zmienić później
        true
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Utwórz trigger na tabeli auth.users
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION fn_handle_new_user();
    