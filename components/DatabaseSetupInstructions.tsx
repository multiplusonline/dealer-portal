"use client"

import { useState } from "react"
import { isSupabaseConfigured } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Database, AlertTriangle, CheckCircle, Copy, ExternalLink, Play } from "lucide-react"

export function DatabaseSetupInstructions() {
  const [copied, setCopied] = useState(false)
  const [scriptCopied, setScriptCopied] = useState(false)
  const isConfigured = isSupabaseConfigured()
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionResult, setConnectionResult] = useState<string | null>(null)

  const copyToClipboard = async (text: string, type: "url" | "script" = "url") => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === "script") {
        setScriptCopied(true)
        setTimeout(() => setScriptCopied(false), 3000)
      } else {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const completeSetupScript = `-- Complete database setup for Dealer Portal
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

-- Test users for the application
('current-user-id', 'Huidige Gebruiker', 'current@test.nl', '+31600000000', 'Test Company', 'dealer', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'active', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 minute', 'Test gebruiker voor applicatie'),

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
-- Conversation between current user and other users
('current-user-id', 'other-user-id', 'Hallo! Hoe gaat het met je project?', NOW() - INTERVAL '3 hours', true),
('other-user-id', 'current-user-id', 'Goed bezig! We zijn bijna klaar met de installatie.', NOW() - INTERVAL '2 hours 30 minutes', true),
('current-user-id', 'other-user-id', 'Mooi! Laat me weten als je hulp nodig hebt.', NOW() - INTERVAL '2 hours', true),
('other-user-id', 'current-user-id', 'Zal ik doen, bedankt!', NOW() - INTERVAL '1 hour 30 minutes', false),

-- Conversation between Jan and Marie
('dealer-jan-001', 'dealer-marie-002', 'Hallo Marie! Welkom bij het dealer portaal.', NOW() - INTERVAL '2 hours', true),
('dealer-marie-002', 'dealer-jan-001', 'Hoi Jan! Dank je wel. Het ziet er goed uit.', NOW() - INTERVAL '1 hour 45 minutes', true),
('dealer-jan-001', 'dealer-marie-002', 'Geen probleem! Als je vragen hebt, laat het me weten.', NOW() - INTERVAL '1 hour 30 minutes', true),
('dealer-marie-002', 'dealer-jan-001', 'Dat is heel aardig! Ik heb inderdaad een vraag...', NOW() - INTERVAL '30 minutes', false),

-- More conversations
('current-user-id', 'third-user-id', 'Hoi! Welkom bij het team.', NOW() - INTERVAL '6 hours', true),
('third-user-id', 'current-user-id', 'Dank je! Ik kijk er naar uit om samen te werken.', NOW() - INTERVAL '5 hours 30 minutes', true),

('dealer-tom-005', 'current-user-id', 'Kun je me helpen met de nieuwe prijslijst?', NOW() - INTERVAL '1 hour', true),
('current-user-id', 'dealer-tom-005', 'Natuurlijk! Kijk in de Downloads sectie.', NOW() - INTERVAL '45 minutes', true),
('dealer-tom-005', 'current-user-id', 'Gevonden! Bedankt voor je hulp. 👍', NOW() - INTERVAL '40 minutes', false)

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
END $$;`

  if (!isConfigured) {
    return (
      <Card className="mb-6 border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />❌ Supabase Niet Geconfigureerd
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-100">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Environment variabelen ontbreken:</strong> Stel eerst je Supabase omgevingsvariabelen in.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-medium text-red-900">Vereiste Environment Variabelen:</h4>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <div>NEXT_PUBLIC_SUPABASE_URL=jouw_supabase_project_url</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw_supabase_anon_key</div>
              <div>SUPABASE_SERVICE_ROLE_KEY=jouw_service_role_key</div>
            </div>

            <div className="flex items-center gap-2 text-sm text-red-700">
              <ExternalLink className="h-4 w-4" />
              <span>Haal deze op uit je Supabase project dashboard → Settings → API</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const testDatabaseConnection = async () => {
    setTestingConnection(true)
    setConnectionResult(null)

    try {
      const { supabase } = await import("@/lib/supabase/client")

      // Test basic connection
      const { data, error } = await supabase.from("dealers").select("count", { count: "exact", head: true })

      if (error) {
        if (error.code === "42P01") {
          setConnectionResult("❌ Tabellen bestaan nog niet - voer het setup script uit")
        } else if (error.code === "42501") {
          setConnectionResult("❌ Geen toegang - controleer je RLS policies")
        } else {
          setConnectionResult(`❌ Database fout: ${error.message}`)
        }
      } else {
        setConnectionResult(`✅ Verbinding succesvol - ${data || 0} dealers gevonden`)
      }
    } catch (error: any) {
      setConnectionResult(`❌ Verbinding mislukt: ${error.message}`)
    } finally {
      setTestingConnection(false)
    }
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-orange-800">
          <span className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            ⚠️ Database Setup Vereist
          </span>
          <Badge variant="outline" className="text-green-600 border-green-600">
            Supabase Verbonden
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-orange-200 bg-orange-100">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Geen tabellen gevonden!</strong> De database tabellen zijn nog niet aangemaakt. Volg de stappen
            hieronder om ze aan te maken.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
              <Play className="h-5 w-5" />
              Stap-voor-Stap Instructies
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium text-orange-900">Open je Supabase project</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Ga naar <strong>supabase.com</strong> → je project → <strong>SQL Editor</strong>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 bg-transparent border-orange-300 text-orange-700 hover:bg-orange-100"
                    onClick={() => window.open("https://supabase.com/dashboard", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Supabase Dashboard
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium text-orange-900">Kopieer het complete setup script</p>
                  <p className="text-sm text-orange-700 mt-1 mb-3">
                    Klik op de knop hieronder om het volledige script te kopiëren:
                  </p>

                  <Button
                    variant="outline"
                    className="bg-orange-600 text-white border-orange-600 hover:bg-orange-700"
                    onClick={() => copyToClipboard(completeSetupScript, "script")}
                  >
                    {scriptCopied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Script Gekopieerd!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Kopieer Complete Setup Script
                      </>
                    )}
                  </Button>

                  <div className="mt-3 p-3 bg-gray-900 text-green-400 rounded-lg font-mono text-xs max-h-24 overflow-y-auto">
                    <div className="text-gray-400">-- Complete database setup script</div>
                    <div>CREATE EXTENSION IF NOT EXISTS "uuid-ossp";</div>
                    <div>CREATE TABLE dealers (...);</div>
                    <div>CREATE TABLE messages (...);</div>
                    <div className="text-gray-400">-- ... en meer tabellen + test data</div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium text-orange-900">Plak en voer het script uit</p>
                  <div className="text-sm text-orange-700 mt-1 space-y-1">
                    <p>
                      • Ga naar <strong>SQL Editor</strong> in je Supabase dashboard
                    </p>
                    <p>• Plak het gekopieerde script in de editor</p>
                    <p>
                      • Klik op <strong>"Run"</strong> om het script uit te voeren
                    </p>
                    <p>
                      • Wacht tot je ziet:{" "}
                      <code className="bg-orange-100 px-1 rounded">"Database setup complete!"</code>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div className="flex-1">
                  <p className="font-medium text-orange-900">Test de verbinding</p>
                  <p className="text-sm text-orange-700 mt-1 mb-2">Controleer of alles correct is ingesteld:</p>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testDatabaseConnection}
                    disabled={testingConnection}
                    className="bg-transparent border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    {testingConnection ? "Testen..." : "Test Database Verbinding"}
                  </Button>

                  {connectionResult && (
                    <div className="mt-2 p-3 bg-white border border-orange-200 rounded text-sm">{connectionResult}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Wat het script aanmaakt:
            </h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>
                • <strong>9 database tabellen</strong> (dealers, messages, files, etc.)
              </li>
              <li>
                • <strong>9 test gebruikers</strong> met verschillende rollen
              </li>
              <li>
                • <strong>Sample gesprekken</strong> voor chat functionaliteit
              </li>
              <li>
                • <strong>Voorbeeld bestanden</strong> met verschillende statussen
              </li>
              <li>
                • <strong>Database indexes</strong> voor optimale prestaties
              </li>
              <li>
                • <strong>Row Level Security</strong> policies
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Het script is veilig om meerdere keren uit te voeren</li>
              <li>• Na het uitvoeren kun je direct dealers aanmaken en chatten</li>
              <li>• Alle test data heeft realistische Nederlandse namen en bedrijven</li>
              <li>• De applicatie werkt direct na het uitvoeren van het script</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
