CREATE TABLE public.lab_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 24),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.lab_players TO anon, authenticated;
GRANT ALL ON public.lab_players TO service_role;
ALTER TABLE public.lab_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players readable by everyone" ON public.lab_players FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anyone can join" ON public.lab_players FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anyone can heartbeat" ON public.lab_players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.lab_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room TEXT NOT NULL DEFAULT 'lab',
  player_id UUID REFERENCES public.lab_players(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 24),
  text TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX lab_messages_room_created_idx ON public.lab_messages (room, created_at DESC);
GRANT SELECT, INSERT ON public.lab_messages TO anon, authenticated;
GRANT ALL ON public.lab_messages TO service_role;
ALTER TABLE public.lab_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages readable by everyone" ON public.lab_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anyone can post" ON public.lab_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_players;