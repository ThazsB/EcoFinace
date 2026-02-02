-- Script de configuração do Supabase para EcoFinance
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  category TEXT NOT NULL DEFAULT 'sistema',
  priority TEXT NOT NULL DEFAULT 'normal',
  date TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  snoozed_until TEXT,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (now()::text),
  updated_at TEXT NOT NULL DEFAULT (now()::text),
  
  CONSTRAINT fk_profile FOREIGN KEY (profile_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Criar tabela de sessões de dispositivos
CREATE TABLE IF NOT EXISTS device_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  last_active TEXT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TEXT NOT NULL DEFAULT (now()::text),
  updated_at TEXT NOT NULL DEFAULT (now()::text),
  
  CONSTRAINT fk_profile_device FOREIGN KEY (profile_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_device_profile UNIQUE (profile_id, device_id)
);

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notifications_profile ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(date DESC);
CREATE INDEX IF NOT EXISTS idx_device_sessions_profile ON device_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_active ON device_sessions(profile_id, last_active DESC);

-- 4. Habilitar Realtime para as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE device_sessions;

-- 5. Criar política de segurança (RLS) para notificações
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS
-- Notificações: usuário só vê suas próprias notificações
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid()::text = profile_id);

CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid()::text = profile_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid()::text = profile_id);

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid()::text = profile_id);

-- Device sessions: usuário só vê e gerencia suas próprias sessões
CREATE POLICY "Users can view own device sessions" ON device_sessions
  FOR SELECT USING (auth.uid()::text = profile_id);

CREATE POLICY "Users can insert own device sessions" ON device_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = profile_id);

CREATE POLICY "Users can update own device sessions" ON device_sessions
  FOR UPDATE USING (auth.uid()::text = profile_id);

CREATE POLICY "Users can delete own device sessions" ON device_sessions
  FOR DELETE USING (auth.uid()::text = profile_id);

-- 7. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now()::text;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Criar triggers para updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_sessions_updated_at
  BEFORE UPDATE ON device_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Criar função para cleanup automático de sessões antigas
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM device_sessions 
  WHERE last_active < (now() - INTERVAL '30 days')::text
  AND NOT is_current;
END;
$$ language 'plpgsql';

-- Executar cleanup a cada dia (opcional - configurar no Supabase Cron se desejado)
-- SELECT cleanup_old_sessions();

-- 10. Comentários
COMMENT ON TABLE notifications IS 'Notificações sincronizadas entre dispositivos do usuário';
COMMENT ON TABLE device_sessions IS 'Sessões de dispositivos ativas do usuário';
COMMENT ON COLUMN notifications.profile_id IS 'ID do usuário (auth.users)';
COMMENT ON COLUMN device_sessions.profile_id IS 'ID do usuário (auth.users)';
