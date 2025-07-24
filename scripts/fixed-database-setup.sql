-- Fixed database setup for Dealer Portal with proper UUIDs
-- Run this script in your Supabase SQL Editor

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

-- Create other log tables
CREATE TABLE login_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET
);

CREATE TABLE download_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE upload_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  folder TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Insert test users with proper UUIDs (let database generate them)
-- We'll store the generated UUIDs in variables for later use

-- Insert dealers and capture their UUIDs
DO $$
DECLARE
    admin_id UUID;
    jan_id UUID;
    marie_id UUID;
    piet_id UUID;
    anna_id UUID;
    tom_id UUID;
    current_id UUID;
    other_id UUID;
    third_id UUID;
BEGIN
    -- Insert admin user
    INSERT INTO dealers (name, email, phone, company, role, profile_picture, status, is_active, registration_date, last_login, notes)
    VALUES ('Admin Beheerder', 'admin@dealerportaal.nl', '+31612345678', 'Dealer Portaal BV', 'admin', 
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 
            'active', true, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 minutes', 'Hoofdbeheerder van het systeem')
    RETURNING id INTO admin_id;

    -- Insert Jan
    INSERT INTO dealers (name, email, phone, company, role, profile_picture, status, is_active, registration_date, last_login, notes)
    VALUES ('Jan van der Berg', 'jan.vandenberg@autohandel.nl', '+31687654321', 'Van der Berg Auto', 'dealer',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            'active', true, NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 minutes', 'Ervaren dealer, gespecialiseerd in gebruikte auto''s')
    RETURNING id INTO jan_id;

    -- Insert Marie
    INSERT INTO dealers (name, email, phone, company, role, profile_picture, status, is_active, registration_date, last_login, notes)
    VALUES ('Marie Bakker', 'marie@bakkerautos.nl', '+31698765432', 'Bakker Automotive', 'dealer',
            'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            'active', true, NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 minute', 'Nieuwe dealer, enthousiast en leergierig')
    RETURNING id INTO marie_id;

    -- Insert Piet
    INSERT INTO dealers (name, email, phone, company, role, profile_picture, status, is_active, registration_date, last_login, notes)
    VALUES ('Piet de Vries', 'piet@vriesautos.nl', '+31676543210', 'De Vries Motors', 'dealer',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            'active', true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '10 minutes', 'Gespecialiseerd in elektrische voertuigen')
    RETURNING id INTO piet_id;

    -- Insert Anna
    INSERT INTO dealers (name, email, phone, company, role, profile_picture, status, is_active, registration_date, last_login, notes)
    VALUES ('Anna van der Berg', 'anna@premiumcars.nl', '+31665432109', 'Premium Cars Nederland', 'manager',
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
            'active', true, NOW() - INTERVAL '20 days', NOW() - INTERVAL '30 minutes', 'Manager met focus op premium merken')
    RETURNING id INTO anna_id;

    -- Insert Tom
    INSERT INTO dealers (name, email, phone, company, role, profile_picture, status, is_active, registration_date, last_login, notes)
    VALUES ('Tom Hendriks', 'tom@hendriksauto.nl', '+31654321098', 'Hendriks Autohandel', 'dealer',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
            'active', true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 hour', 'Jonge ondernemer met moderne aanpak')
    RETURNING id INTO tom_id;

    -- Insert test users for the application
    INSERT INTO dealers (name, email, phone, company, role, profile_picture, status, is_active, registration_date, last_login, notes)
    VALUES ('Huidige Gebruiker', 'current@test.nl', '+31600000000', 'Test Company', 'dealer',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            'active', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 minute', 'Test gebruiker voor applicatie')
    RETURNING id INTO current_id;

    INSERT INTO dealers (name, email, phone, company, role, profile_picture, status, is_active, registration_date, last_login, notes)
    VALUES ('Andere Gebruiker', 'other@test.nl', '+31600000001', 'Other Company', 'dealer',
            'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            'active', true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '3 minutes', 'Andere test gebruiker')
    RETURNING id INTO other_id;

    INSERT INTO dealers (name, email, phone, company, role, profile_picture, status, is_active, registration_date, last_login, notes)
    VALUES ('Derde Gebruiker', 'third@test.nl', '+31600000002', 'Third Company', 'dealer',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            'active', true, NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 minutes', 'Derde test gebruiker')
    RETURNING id INTO third_id;

    -- Insert user preferences for all users
    INSERT INTO user_preferences (user_id, language, theme, notifications_enabled, email_notifications, chat_notifications)
    VALUES 
        (admin_id, 'nl', 'light', true, true, true),
        (jan_id, 'nl', 'light', true, true, true),
        (marie_id, 'en', 'light', true, false, true),
        (piet_id, 'nl', 'dark', true, true, false),
        (anna_id, 'nl', 'light', false, false, false),
        (tom_id, 'nl', 'light', true, true, true),
        (current_id, 'nl', 'light', true, true, true),
        (other_id, 'nl', 'light', true, true, true),
        (third_id, 'nl', 'light', true, true, true);

    -- Insert sample messages between users
    INSERT INTO messages (sender_id, receiver_id, message, timestamp, read) VALUES
        -- Conversation between current user and other users
        (current_id, other_id, 'Hallo! Hoe gaat het met je project?', NOW() - INTERVAL '3 hours', true),
        (other_id, current_id, 'Goed bezig! We zijn bijna klaar met de installatie.', NOW() - INTERVAL '2 hours 30 minutes', true),
        (current_id, other_id, 'Mooi! Laat me weten als je hulp nodig hebt.', NOW() - INTERVAL '2 hours', true),
        (other_id, current_id, 'Zal ik doen, bedankt!', NOW() - INTERVAL '1 hour 30 minutes', false),

        -- Conversation between Jan and Marie
        (jan_id, marie_id, 'Hallo Marie! Welkom bij het dealer portaal.', NOW() - INTERVAL '2 hours', true),
        (marie_id, jan_id, 'Hoi Jan! Dank je wel. Het ziet er goed uit.', NOW() - INTERVAL '1 hour 45 minutes', true),
        (jan_id, marie_id, 'Geen probleem! Als je vragen hebt, laat het me weten.', NOW() - INTERVAL '1 hour 30 minutes', true),
        (marie_id, jan_id, 'Dat is heel aardig! Ik heb inderdaad een vraag...', NOW() - INTERVAL '30 minutes', false),

        -- More conversations
        (current_id, third_id, 'Hoi! Welkom bij het team.', NOW() - INTERVAL '6 hours', true),
        (third_id, current_id, 'Dank je! Ik kijk er naar uit om samen te werken.', NOW() - INTERVAL '5 hours 30 minutes', true),

        (tom_id, current_id, 'Kun je me helpen met de nieuwe prijslijst?', NOW() - INTERVAL '1 hour', true),
        (current_id, tom_id, 'Natuurlijk! Kijk in de Downloads sectie.', NOW() - INTERVAL '45 minutes', true),
        (tom_id, current_id, 'Gevonden! Bedankt voor je hulp. 👍', NOW() - INTERVAL '40 minutes', false),

        -- Admin messages
        (admin_id, jan_id, 'Jan, bedankt voor je hulp aan nieuwe dealers. Zeer gewaardeerd!', NOW() - INTERVAL '4 hours', true),
        (jan_id, admin_id, 'Graag gedaan! Het is belangrijk dat iedereen zich welkom voelt.', NOW() - INTERVAL '3 hours 45 minutes', true);

    -- Insert sample files
    INSERT INTO files (user_id, filename, folder, status, url, created_at) VALUES
        (current_id, 'product-catalog.pdf', 'Marketing Materials', 'approved', '/placeholder.svg?height=200&width=200&text=PDF', NOW() - INTERVAL '1 day'),
        (current_id, 'price-list-2024.xlsx', 'Price Lists', 'pending', '/placeholder.svg?height=200&width=200&text=Excel', NOW() - INTERVAL '12 hours'),
        (other_id, 'technical-specs.pdf', 'Documentation', 'approved', '/placeholder.svg?height=200&width=200&text=PDF', NOW() - INTERVAL '6 hours'),
        (third_id, 'installation-guide.pdf', 'Documentation', 'approved', '/placeholder.svg?height=200&width=200&text=PDF', NOW() - INTERVAL '3 hours'),
        (jan_id, 'warranty-info.pdf', 'Legal', 'approved', '/placeholder.svg?height=200&width=200&text=PDF', NOW() - INTERVAL '2 days'),
        (marie_id, 'user-manual.pdf', 'Documentation', 'pending', '/placeholder.svg?height=200&width=200&text=PDF', NOW() - INTERVAL '8 hours');

    -- Insert sample user sessions for activity tracking
    INSERT INTO user_sessions (user_id, session_start, session_end, ip_address, user_agent, is_active) VALUES
        (jan_id, NOW() - INTERVAL '2 hours', NULL, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', true),
        (marie_id, NOW() - INTERVAL '1 hour', NULL, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', true),
        (piet_id, NOW() - INTERVAL '30 minutes', NULL, '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', true),
        (anna_id, NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '15 minutes', '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', false),
        (tom_id, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', '192.168.1.104', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', false),
        (admin_id, NOW() - INTERVAL '10 minutes', NULL, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', true),
        (current_id, NOW() - INTERVAL '5 minutes', NULL, '192.168.1.105', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', true),
        (other_id, NOW() - INTERVAL '15 minutes', NULL, '192.168.1.106', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', true),
        (third_id, NOW() - INTERVAL '25 minutes', NULL, '192.168.1.107', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', true);

    -- Insert some sample chat logs
    INSERT INTO chat_logs (user_id, action, details, timestamp) VALUES
        (current_id, 'conversation_started', '{"with_user": "other-user"}', NOW() - INTERVAL '3 hours'),
        (current_id, 'message_sent', '{"to_user": "other-user", "message_length": 25}', NOW() - INTERVAL '3 hours'),
        (other_id, 'message_sent', '{"to_user": "current-user", "message_length": 45}', NOW() - INTERVAL '2 hours 30 minutes'),
        (jan_id, 'conversation_started', '{"with_user": "marie"}', NOW() - INTERVAL '2 hours'),
        (marie_id, 'message_read', '{"from_user": "jan"}', NOW() - INTERVAL '1 hour 45 minutes');

    -- Show results
    RAISE NOTICE 'Database setup complete!';
    RAISE NOTICE 'Admin ID: %', admin_id;
    RAISE NOTICE 'Current user ID: %', current_id;
    RAISE NOTICE 'Other user ID: %', other_id;
    RAISE NOTICE 'Third user ID: %', third_id;
    
    -- Show final counts
    RAISE NOTICE 'Created % dealers', (SELECT COUNT(*) FROM dealers);
    RAISE NOTICE 'Created % messages', (SELECT COUNT(*) FROM messages);
    RAISE NOTICE 'Created % files', (SELECT COUNT(*) FROM files);
END $$;
