-- Script de configuração do Supabase para Fins
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
  browser TEXT NOT NULL,
  os TEXT NOT NULL,
  last_active TEXT NOT NULL DEFAULT (now()::text),
  created_at TEXT NOT NULL DEFAULT (now()::text),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  CONSTRAINT fk_profile FOREIGN KEY (profile_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_profile ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(date);
CREATE INDEX IF NOT EXISTS idx_device_sessions_profile ON device_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_device ON device_sessions(device_id);

-- 4. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now()::text;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Criar triggers para updated_at
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_device_sessions_updated_at ON device_sessions;
CREATE TRIGGER update_device_sessions_updated_at
    BEFORE UPDATE ON device_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Criar política de Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para notificações
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own notifications" ON notifications
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (profile_id = auth.uid());

-- Políticas para device_sessions
CREATE POLICY "Users can view their own sessions" ON device_sessions
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own sessions" ON device_sessions
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON device_sessions
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own sessions" ON device_sessions
    FOR DELETE USING (profile_id = auth.uid());

-- 7. Funções para gerenciar dispositivos
CREATE OR REPLACE FUNCTION register_device(
  p_device_id TEXT,
  p_device_name TEXT,
  p_device_type TEXT,
  p_browser TEXT,
  p_os TEXT
) RETURNS TEXT AS $$
DECLARE
  v_session_id TEXT;
BEGIN
  INSERT INTO device_sessions (id, profile_id, device_id, device_name, device_type, browser, os)
  VALUES (
    gen_random_uuid()::text,
    auth.uid(),
    p_device_id,
    p_device_name,
    p_device_type,
    p_browser,
    p_os
  )
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_device_activity(p_device_id TEXT) RETURNS void AS $$
BEGIN
  UPDATE device_sessions
  SET last_active = now()::text, is_active = true
  WHERE device_id = p_device_id AND profile_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION logout_device(p_device_id TEXT) RETURNS void AS $$
BEGIN
  UPDATE device_sessions
  SET is_active = false
  WHERE device_id = p_device_id AND profile_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Funções para notificações
CREATE OR REPLACE FUNCTION create_notification(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_category TEXT DEFAULT 'sistema',
  p_priority TEXT DEFAULT 'normal'
) RETURNS TEXT AS $$
DECLARE
  v_notification_id TEXT;
BEGIN
  INSERT INTO notifications (id, profile_id, title, message, type, category, priority, date)
  VALUES (
    gen_random_uuid()::text,
    auth.uid(),
    p_title,
    p_message,
    p_type,
    p_category,
    p_priority,
    now()::text
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_notification_read(p_id TEXT) RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read = true, read_at = now()::text
  WHERE id = p_id AND profile_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_all_notifications_read() RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read = true, read_at = now()::text
  WHERE profile_id = auth.uid() AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Habilitar Realtime para notificações
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE notifications;

-- 10. Comentários para documentação
COMMENT ON TABLE notifications IS 'Tabela de notificações do sistema Fins';
COMMENT ON TABLE device_sessions IS 'Tabela de sessões de dispositivos do sistema Fins';
COMMENT ON FUNCTION register_device IS 'Registra um novo dispositivo para o usuário atual';
COMMENT ON FUNCTION update_device_activity IS 'Atualiza a última atividade de um dispositivo';
COMMENT ON FUNCTION create_notification IS 'Cria uma nova notificação para o usuário atual';
