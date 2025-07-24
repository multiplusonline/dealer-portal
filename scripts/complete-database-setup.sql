-- Complete database setup for Dealer Portal
-- This script creates all necessary tables, indexes, and sample data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS chat_logs CASCADE;
DROP TABLE IF EXISTS upload_logs CASCADE;
DROP TABLE IF EXISTS download_logs CASCADE;
DROP TABLE IF EXISTS login_logs CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS dealers CASCADE;

-- Create dealers table
CREATE TABLE dealers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  role TEXT DEFAULT 'dealer' CHECK (role IN ('admin', 'dealer', 'manager')),
  profile_picture TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create files table
CREATE TABLE files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  folder TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Create user sessions table
CREATE TABLE user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Create user preferences table
CREATE TABLE user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES dealers(id) ON DELETE CASCADE UNIQUE,
  language TEXT DEFAULT 'nl',
  theme TEXT DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  chat_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create login logs table
CREATE TABLE login_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET
);

-- Create download logs table
CREATE TABLE download_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create upload logs table
CREATE TABLE upload_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  folder TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat logs table
CREATE TABLE chat_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_dealers_email ON dealers(email);
CREATE INDEX idx_dealers_role ON dealers(role);
CREATE INDEX idx_dealers_is_active ON dealers(is_active);
CREATE INDEX idx_dealers_last_activity ON dealers(last_activity);
CREATE INDEX idx_dealers_status ON dealers(status);

CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_status ON files(status);
CREATE INDEX idx_files_created_at ON files(created_at);

CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, timestamp);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_unread ON messages(receiver_id, read) WHERE read = false;
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;

CREATE INDEX idx_chat_logs_user_id ON chat_logs(user_id);
CREATE INDEX idx_chat_logs_timestamp ON chat_logs(timestamp);

-- Function to update last_activity automatically
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_activity on any update
CREATE TRIGGER trigger_update_last_activity
  BEFORE UPDATE ON dealers
  FOR EACH ROW
  EXECUTE FUNCTION update_last_activity();

-- Enable Row Level Security (RLS)
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (permissive for demo - adjust for production)
CREATE POLICY "Enable all operations for all users" ON dealers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON user_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON user_preferences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON login_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON download_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON upload_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON chat_logs FOR ALL USING (true) WITH CHECK (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('uploads', 'uploads', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Insert comprehensive test users
INSERT INTO dealers (id, name, email, phone, company, role, profile_picture, status, is_active, registration_date, last_login, notes) VALUES
-- Admin users
('admin-user-1', 'Admin Beheerder', 'admin@dealerportaal.nl', '+31612345678', 'Dealer Portaal BV', 'admin', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'active', true, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 minutes', 'Hoofdbeheerder van het systeem'),

-- Active dealers
('dealer-jan-001', 'Jan van der Berg', 'jan.vandenberg@autohandel.nl', '+31687654321', 'Van der Berg Auto', 'dealer', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'active', true, NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 minutes', 'Ervaren dealer, gespecialiseerd in gebruikte auto''s'),

('dealer-marie-002', 'Marie Bakker', 'marie@bakkerautos.nl', '+31698765432', 'Bakker Automotive', 'dealer', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 'active', true, NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 minute', 'Nieuwe dealer, enthousiast en leergierig'),

('dealer-piet-003', 'Piet de Vries', 'piet@vriesautos.nl', '+31676543210', 'De Vries Motors', 'dealer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'active', true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '10 minutes', 'Gespecialiseerd in elektrische voertuigen'),

('dealer-anna-004', 'Anna van der Berg', 'anna@premiumcars.nl', '+31665432109', 'Premium Cars Nederland', 'manager', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 'active', true, NOW() - INTERVAL '20 days', NOW() - INTERVAL '30 minutes', 'Manager met focus op premium merken'),

('dealer-tom-005', 'Tom Hendriks', 'tom@hendriksauto.nl', '+31654321098', 'Hendriks Autohandel', 'dealer', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 'active', true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 hour', 'Jonge ondernemer met moderne aanpak'),

-- Inactive/test users
('dealer-inactive-006', 'Lisa Jansen', 'lisa@jansenmotor.nl', '+31643210987', 'Jansen Motor Company', 'dealer', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 'inactive', false, NOW() - INTERVAL '45 days', NOW() - INTERVAL '7 days', 'Tijdelijk inactief wegens vakantie'),

('dealer-pending-007', 'Mark Visser', 'mark@visserautos.nl', '+31632109876', 'Visser Automotive', 'dealer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'active', true, NOW() - INTERVAL '2 days', NULL, 'Nieuwe registratie, nog niet ingelogd'),

('dealer-test-008', 'Sarah de Jong', 'sarah@testdealer.nl', '+31621098765', 'Test Dealer BV', 'dealer', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face', 'active', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours', 'Test account voor ontwikkeling'),

-- Current user for testing
('current-user-id', 'Huidige Gebruiker', 'current@test.nl', '+31600000000', 'Test Company', 'dealer', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'active', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 minute', 'Test gebruiker voor applicatie'),

-- Other test users
('other-user-id', 'Andere Gebruiker', 'other@test.nl', '+31600000001', 'Other Company', 'dealer', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 'active', true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '3 minutes', 'Andere test gebruiker'),

('third-user-id', 'Derde Gebruiker', 'third@test.nl', '+31600000002', 'Third Company', 'dealer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'active', true, NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 minutes', 'Derde test gebruiker')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  company = EXCLUDED.company,
  role = EXCLUDED.role,
  profile_picture = EXCLUDED.profile_picture,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  notes = EXCLUDED.notes,
  last_login = EXCLUDED.last_login;

-- Insert user preferences for test users
INSERT INTO user_preferences (user_id, language, theme, notifications_enabled, email_notifications, chat_notifications) VALUES
('admin-user-1', 'nl', 'light', true, true, true),
('dealer-jan-001', 'nl', 'light', true, true, true),
('dealer-marie-002', 'en', 'light', true, false, true),
('dealer-piet-003', 'nl', 'dark', true, true, false),
('dealer-anna-004', 'nl', 'light', false, false, false),
('dealer-tom-005', 'nl', 'light', true, true, true),
('dealer-inactive-006', 'nl', 'light', true, true, true),
('dealer-pending-007', 'nl', 'light', true, true, true),
('dealer-test-008', 'en', 'dark', true, true, true),
('current-user-id', 'nl', 'light', true, true, true),
('other-user-id', 'nl', 'light', true, true, true),
('third-user-id', 'nl', 'light', true, true, true)
ON CONFLICT (user_id) DO UPDATE SET
  language = EXCLUDED.language,
  theme = EXCLUDED.theme,
  notifications_enabled = EXCLUDED.notifications_enabled,
  email_notifications = EXCLUDED.email_notifications,
  chat_notifications = EXCLUDED.chat_notifications,
  updated_at = NOW();

-- Insert sample messages between users for testing
INSERT INTO messages (sender_id, receiver_id, message, timestamp, read) VALUES
-- Conversation between Jan and Marie
('dealer-jan-001', 'dealer-marie-002', 'Hallo Marie! Welkom bij het dealer portaal. Hoe bevalt het tot nu toe?', NOW() - INTERVAL '2 hours', true),
('dealer-marie-002', 'dealer-jan-001', 'Hoi Jan! Dank je wel. Het ziet er goed uit. Ik ben nog aan het wennen aan alle functies.', NOW() - INTERVAL '1 hour 45 minutes', true),
('dealer-jan-001', 'dealer-marie-002', 'Geen probleem! Als je vragen hebt, laat het me weten. Ik gebruik het systeem al een tijdje.', NOW() - INTERVAL '1 hour 30 minutes', true),
('dealer-marie-002', 'dealer-jan-001', 'Dat is heel aardig! Ik heb inderdaad een vraag over de upload functie...', NOW() - INTERVAL '30 minutes', false),

-- Conversation between current user and other users
('current-user-id', 'other-user-id', 'Hallo! Hoe gaat het met je project?', NOW() - INTERVAL '3 hours', true),
('other-user-id', 'current-user-id', 'Goed bezig! We zijn bijna klaar met de installatie.', NOW() - INTERVAL '2 hours 30 minutes', true),
('current-user-id', 'other-user-id', 'Mooi! Laat me weten als je hulp nodig hebt.', NOW() - INTERVAL '2 hours', true),
('other-user-id', 'current-user-id', 'Zal ik doen, bedankt!', NOW() - INTERVAL '1 hour 30 minutes', false),

-- Conversation between Piet and Anna
('dealer-piet-003', 'dealer-anna-004', 'Anna, heb je de nieuwe elektrische modellen al bekeken?', NOW() - INTERVAL '4 hours', true),
('dealer-anna-004', 'dealer-piet-003', 'Ja, zeer indrukwekkend! Vooral de nieuwe Tesla modellen zijn interessant.', NOW() - INTERVAL '3 hours 30 minutes', true),
('dealer-piet-003', 'dealer-anna-004', 'Precies! De vraag naar elektrisch rijden groeit enorm.', NOW() - INTERVAL '3 hours', true),

-- Conversation between Tom and current user
('dealer-tom-005', 'current-user-id', 'Kun je me helpen met de nieuwe prijslijst? Ik kan hem niet vinden.', NOW() - INTERVAL '1 hour', true),
('current-user-id', 'dealer-tom-005', 'Natuurlijk! Kijk in de Downloads sectie onder "Prijslijsten 2024".', NOW() - INTERVAL '45 minutes', true),
('dealer-tom-005', 'current-user-id', 'Gevonden! Bedankt voor je hulp. 👍', NOW() - INTERVAL '40 minutes', false),

-- Admin messages
('admin-user-1', 'dealer-jan-001', 'Jan, bedankt voor je hulp aan nieuwe dealers. Zeer gewaardeerd!', NOW() - INTERVAL '5 hours', true),
('dealer-jan-001', 'admin-user-1', 'Graag gedaan! Het is belangrijk dat iedereen zich welkom voelt.', NOW() - INTERVAL '4 hours 45 minutes', true),

-- Third user conversations
('current-user-id', 'third-user-id', 'Hoi! Welkom bij het team.', NOW() - INTERVAL '6 hours', true),
('third-user-id', 'current-user-id', 'Dank je! Ik kijk er naar uit om samen te werken.', NOW() - INTERVAL '5 hours 30 minutes', true)

ON CONFLICT DO NOTHING;

-- Insert sample files
INSERT INTO files (user_id, filename, folder, status, url, created_at) VALUES
('current-user-id', 'product-catalog.pdf', 'Marketing Materials', 'approved', '/placeholder.svg?height=200&width=200&text=PDF', NOW() - INTERVAL '1 day'),
('current-user-id', 'price-list-2024.xlsx', 'Price Lists', 'pending', '/placeholder.svg?height=200&width=200&text=Excel', NOW() - INTERVAL '12 hours'),
('other-user-id', 'technical-specs.pdf', 'Documentation', 'approved', '/placeholder.svg?height=200&width=200&text=PDF', NOW() - INTERVAL '6 hours'),
('third-user-id', 'installation-guide.pdf', 'Documentation', 'approved', '/placeholder.svg?height=200&width=200&text=PDF', NOW() - INTERVAL '3 hours'),
('dealer-jan-001', 'warranty-info.pdf', 'Legal', 'approved', '/placeholder.svg?height=200&width=200&text=PDF', NOW() - INTERVAL '2 days'),
('dealer-marie-002', 'user-manual.pdf', 'Documentation', 'pending', '/placeholder.svg?height=200&width=200&text=PDF', NOW() - INTERVAL '8 hours')
ON CONFLICT DO NOTHING;

-- Insert sample user sessions for activity tracking
INSERT INTO user_sessions (user_id, session_start, session_end, ip_address, user_agent, is_active) VALUES
('dealer-jan-001', NOW() - INTERVAL '2 hours', NULL, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', true),
('dealer-marie-002', NOW() - INTERVAL '1 hour', NULL, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', true),
('dealer-piet-003', NOW() - INTERVAL '30 minutes', NULL, '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', true),
('dealer-anna-004', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '15 minutes', '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', false),
('dealer-tom-005', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', '192.168.1.104', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', false),
('admin-user-1', NOW() - INTERVAL '10 minutes', NULL, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', true),
('current-user-id', NOW() - INTERVAL '5 minutes', NULL, '192.168.1.105', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', true),
('other-user-id', NOW() - INTERVAL '15 minutes', NULL, '192.168.1.106', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', true),
('third-user-id', NOW() - INTERVAL '25 minutes', NULL, '192.168.1.107', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', true);

-- Insert some sample chat logs
INSERT INTO chat_logs (user_id, action, details, timestamp) VALUES
('current-user-id', 'conversation_started', '{"with_user": "other-user-id"}', NOW() - INTERVAL '3 hours'),
('current-user-id', 'message_sent', '{"to_user": "other-user-id", "message_length": 25}', NOW() - INTERVAL '3 hours'),
('other-user-id', 'message_sent', '{"to_user": "current-user-id", "message_length": 45}', NOW() - INTERVAL '2 hours 30 minutes'),
('dealer-jan-001', 'conversation_started', '{"with_user": "dealer-marie-002"}', NOW() - INTERVAL '2 hours'),
('dealer-marie-002', 'message_read', '{"from_user": "dealer-jan-001"}', NOW() - INTERVAL '1 hour 45 minutes');

-- Grant necessary permissions (adjust for your setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Final verification - show table counts
DO $$
DECLARE
    dealer_count INTEGER;
    message_count INTEGER;
    file_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO dealer_count FROM dealers;
    SELECT COUNT(*) INTO message_count FROM messages;
    SELECT COUNT(*) INTO file_count FROM files;
    
    RAISE NOTICE 'Database setup complete!';
    RAISE NOTICE 'Created % dealers', dealer_count;
    RAISE NOTICE 'Created % messages', message_count;
    RAISE NOTICE 'Created % files', file_count;
END $$;
