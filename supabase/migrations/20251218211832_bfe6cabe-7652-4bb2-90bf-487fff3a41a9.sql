-- Adicionar coluna phone na tabela profiles
ALTER TABLE public.profiles ADD COLUMN phone text;

-- Atualizar trigger para salvar telefone automaticamente no registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, age, position, shirt_number, dominant_foot, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Jogador'),
    COALESCE((NEW.raw_user_meta_data ->> 'age')::integer, 18),
    COALESCE((NEW.raw_user_meta_data ->> 'position')::player_position, 'Meia'),
    COALESCE((NEW.raw_user_meta_data ->> 'shirt_number')::integer, 10),
    COALESCE((NEW.raw_user_meta_data ->> 'dominant_foot')::dominant_foot, 'Destro'),
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
END;
$$;