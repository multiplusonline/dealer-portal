-- Enhanced dealers table with more fields for comprehensive user management
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'dealer' CHECK (role IN ('admin', 'dealer', 'manager'));
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create user sessions table for better activity tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES dealers(id) ON DELETE CASCADE UNIQUE,
  language TEXT DEFAULT 'nl',
  theme TEXT DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  chat_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dealers_email ON dealers(email);
CREATE INDEX IF NOT EXISTS idx_dealers_role ON dealers(role);
CREATE INDEX IF NOT EXISTS idx_dealers_is_active ON dealers(is_active);
CREATE INDEX IF NOT EXISTS idx_dealers_last_activity ON dealers(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;

-- Function to update last_activity automatically
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_activity on any update
DROP TRIGGER IF EXISTS trigger_update_last_activity ON dealers;
CREATE TRIGGER trigger_update_last_activity
  BEFORE UPDATE ON dealers
  FOR EACH ROW
  EXECUTE FUNCTION update_last_activity();

-- Insert comprehensive test users with diverse attributes
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

('dealer-test-008', 'Sarah de Jong', 'sarah@testdealer.nl', '+31621098765', 'Test Dealer BV', 'dealer', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face', 'active', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours', 'Test account voor ontwikkeling')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  company = EXCLUDED.company,
  role = EXCLUDED.role,
  profile_picture = EXCLUDED.profile_picture,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  notes = EXCLUDED.notes;

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
('dealer-test-008', 'en', 'dark', true, true, true)
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

-- Conversation between Piet and Anna
('dealer-piet-003', 'dealer-anna-004', 'Anna, heb je de nieuwe elektrische modellen al bekeken?', NOW() - INTERVAL '3 hours', true),
('dealer-anna-004', 'dealer-piet-003', 'Ja, zeer indrukwekkend! Vooral de nieuwe Tesla modellen zijn interessant.', NOW() - INTERVAL '2 hours 30 minutes', true),
('dealer-piet-003', 'dealer-anna-004', 'Precies! De vraag naar elektrisch rijden groeit enorm. We moeten ons daar goed op voorbereiden.', NOW() - INTERVAL '2 hours', true),

-- Conversation between Tom and Jan
('dealer-tom-005', 'dealer-jan-001', 'Jan, kun je me helpen met de nieuwe prijslijst? Ik kan hem niet vinden.', NOW() - INTERVAL '1 hour', true),
('dealer-jan-001', 'dealer-tom-005', 'Natuurlijk Tom! Kijk in de Downloads sectie onder "Prijslijsten 2024".', NOW() - INTERVAL '45 minutes', true),
('dealer-tom-005', 'dealer-jan-001', 'Gevonden! Bedankt voor je hulp. 👍', NOW() - INTERVAL '40 minutes', false),

-- Admin messages
('admin-user-1', 'dealer-jan-001', 'Jan, bedankt voor je hulp aan nieuwe dealers. Zeer gewaardeerd!', NOW() - INTERVAL '4 hours', true),
('dealer-jan-001', 'admin-user-1', 'Graag gedaan! Het is belangrijk dat iedereen zich welkom voelt.', NOW() - INTERVAL '3 hours 45 minutes', true)

ON CONFLICT DO NOTHING;

-- Insert sample user sessions for activity tracking
INSERT INTO user_sessions (user_id, session_start, session_end, ip_address, user_agent, is_active) VALUES
('dealer-jan-001', NOW() - INTERVAL '2 hours', NULL, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', true),
('dealer-marie-002', NOW() - INTERVAL '1 hour', NULL, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', true),
('dealer-piet-003', NOW() - INTERVAL '30 minutes', NULL, '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', true),
('dealer-anna-004', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '15 minutes', '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', false),
('dealer-tom-005', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', '192.168.1.104', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', false),
('admin-user-1', NOW() - INTERVAL '10 minutes', NULL, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', true);
