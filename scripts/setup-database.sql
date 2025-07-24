-- Create dealers table with profile pictures
CREATE TABLE IF NOT EXISTS dealers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  profile_picture TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  folder TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat logs table
CREATE TABLE IF NOT EXISTS chat_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create other log tables
CREATE TABLE IF NOT EXISTS login_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET
);

CREATE TABLE IF NOT EXISTS download_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS upload_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  folder TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_dealers_status ON dealers(status);
CREATE INDEX IF NOT EXISTS idx_dealers_email ON dealers(email);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);

-- Enable Row Level Security
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies for demo)
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON dealers FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" ON dealers FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users" ON dealers FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON messages FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users" ON messages FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON files FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" ON files FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users" ON files FOR UPDATE USING (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true), ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample dealers
INSERT INTO dealers (id, name, email, profile_picture, status, created_at, last_login) VALUES
('current-user-id', 'Jan Jansen', 'jan@example.com', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'active', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 hour'),
('other-user-id', 'Marie Bakker', 'marie@example.com', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 'active', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 hours'),
('third-user-id', 'Piet de Vries', 'piet@example.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'active', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
('fourth-user-id', 'Anna van der Berg', 'anna@example.com', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 'active', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 hours'),
('fifth-user-id', 'Tom Hendriks', 'tom@example.com', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 'inactive', NOW() - INTERVAL '10 days', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  profile_picture = EXCLUDED.profile_picture,
  status = EXCLUDED.status,
  last_login = EXCLUDED.last_login;

-- Insert sample messages
INSERT INTO messages (sender_id, receiver_id, message, timestamp, read) VALUES
('current-user-id', 'other-user-id', 'Hallo Marie, heb je de nieuwe prijslijst al ontvangen?', NOW() - INTERVAL '2 hours', true),
('other-user-id', 'current-user-id', 'Ja, ik heb hem gisteren gedownload. Bedankt!', NOW() - INTERVAL '1 hour 30 minutes', true),
('current-user-id', 'other-user-id', 'Mooi! Heb je nog vragen over de nieuwe producten?', NOW() - INTERVAL '1 hour', true),
('other-user-id', 'current-user-id', 'Ja, ik zou graag meer info willen over de technische specificaties van product X.', NOW() - INTERVAL '30 minutes', false),
('current-user-id', 'third-user-id', 'Hoi Piet, hoe gaat het met je project?', NOW() - INTERVAL '3 hours', true),
('third-user-id', 'current-user-id', 'Goed bezig! We zijn bijna klaar met de installatie.', NOW() - INTERVAL '2 hours', true),
('third-user-id', 'current-user-id', 'Kunnen we volgende week een afspraak maken voor de oplevering?', NOW() - INTERVAL '1 hour', false),
('current-user-id', 'fourth-user-id', 'Anna, welkom bij het team!', NOW() - INTERVAL '4 hours', true),
('fourth-user-id', 'current-user-id', 'Dank je wel! Ik kijk er naar uit om samen te werken.', NOW() - INTERVAL '3 hours 30 minutes', true)
ON CONFLICT DO NOTHING;

-- Insert sample files
INSERT INTO files (user_id, filename, folder, status, url, created_at) VALUES
('current-user-id', 'product-catalog.pdf', 'Marketing Materials', 'approved', '/placeholder.svg?height=200&width=200&text=PDF', NOW() - INTERVAL '1 day'),
('current-user-id', 'price-list-2024.xlsx', 'Price Lists', 'pending', '/placeholder.svg?height=200&width=200&text=Excel', NOW() - INTERVAL '12 hours'),
('other-user-id', 'technical-specs.pdf', 'Documentation', 'approved', '/placeholder.svg?height=200&width=200&text=PDF', NOW() - INTERVAL '6 hours'),
('third-user-id', 'installation-guide.pdf', 'Documentation', 'approved', '/placeholder.svg?height=200&width=200&text=PDF', NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;
