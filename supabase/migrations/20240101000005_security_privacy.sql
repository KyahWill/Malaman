-- Security and Privacy Tables Migration
-- Adds tables for audit logging, data export/deletion requests, and incident response

-- Audit Logs Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Can be anonymized, so not a foreign key
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  anonymized_at TIMESTAMP WITH TIME ZONE
);

-- Index for efficient querying
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Data Export Requests Table
CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  format TEXT NOT NULL CHECK (format IN ('json', 'csv', 'xml')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  download_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Index for efficient querying
CREATE INDEX idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX idx_data_export_requests_status ON data_export_requests(status);

-- Data Deletion Requests Table
CREATE TABLE data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  deletion_type TEXT NOT NULL CHECK (deletion_type IN ('soft', 'hard')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  retention_period_days INTEGER DEFAULT 30,
  error_message TEXT,
  confirmation_token TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Index for efficient querying
CREATE INDEX idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
CREATE INDEX idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX idx_data_deletion_requests_token ON data_deletion_requests(confirmation_token);

-- Security Incidents Table
CREATE TABLE security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN (
    'data_breach', 'unauthorized_access', 'system_compromise', 'malware_detection',
    'ddos_attack', 'phishing_attempt', 'insider_threat', 'data_corruption',
    'service_disruption', 'privacy_violation', 'compliance_breach'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_users TEXT[] DEFAULT '{}',
  affected_resources TEXT[] DEFAULT '{}',
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reported_by TEXT,
  status TEXT NOT NULL CHECK (status IN (
    'detected', 'investigating', 'contained', 'mitigated', 'resolved', 'closed'
  )) DEFAULT 'detected',
  response_actions JSONB DEFAULT '[]',
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX idx_security_incidents_type ON security_incidents(type);
CREATE INDEX idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX idx_security_incidents_status ON security_incidents(status);
CREATE INDEX idx_security_incidents_detected_at ON security_incidents(detected_at);

-- Incident Notifications Table
CREATE TABLE incident_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES security_incidents(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('internal', 'user', 'regulatory', 'public')),
  recipients TEXT[] NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('pending', 'sent', 'failed')) DEFAULT 'pending'
);

-- Index for efficient querying
CREATE INDEX idx_incident_notifications_incident_id ON incident_notifications(incident_id);
CREATE INDEX idx_incident_notifications_type ON incident_notifications(notification_type);

-- Add deleted_at column to existing tables for soft deletion
ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE courses ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE lessons ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE assessments ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE assessment_attempts ADD COLUMN anonymized_at TIMESTAMP WITH TIME ZONE;

-- Create storage bucket for data exports
INSERT INTO storage.buckets (id, name, public) VALUES ('data-exports', 'data-exports', false);

-- RLS Policies for Security Tables

-- Audit Logs - Only admins can read, system can write
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Data Export Requests - Users can manage their own requests
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own export requests" ON data_export_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own export requests" ON data_export_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can update export requests" ON data_export_requests
  FOR UPDATE USING (true);

-- Data Deletion Requests - Users can manage their own requests
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deletion requests" ON data_deletion_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own deletion requests" ON data_deletion_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own deletion requests" ON data_deletion_requests
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can update deletion requests" ON data_deletion_requests
  FOR UPDATE USING (true);

-- Security Incidents - Only admins can access
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage security incidents" ON security_incidents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can manage security incidents" ON security_incidents
  FOR ALL USING (true);

-- Incident Notifications - Only admins can access
ALTER TABLE incident_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view incident notifications" ON incident_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can manage incident notifications" ON incident_notifications
  FOR ALL USING (true);

-- Storage policies for data exports
CREATE POLICY "Users can download own data exports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'data-exports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "System can manage data export files" ON storage.objects
  FOR ALL USING (bucket_id = 'data-exports');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for security_incidents table
CREATE TRIGGER update_security_incidents_updated_at 
  BEFORE UPDATE ON security_incidents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired data export files
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS void AS $$
BEGIN
  -- Delete expired export requests and their files
  DELETE FROM data_export_requests 
  WHERE status = 'completed' 
  AND expires_at < NOW();
  
  -- Note: In a real implementation, you'd also delete the actual files from storage
END;
$$ language 'plpgsql';

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-exports', '0 2 * * *', 'SELECT cleanup_expired_exports();');

COMMENT ON TABLE audit_logs IS 'Tracks all data access and modifications for compliance';
COMMENT ON TABLE data_export_requests IS 'Manages user data export requests for GDPR/CCPA compliance';
COMMENT ON TABLE data_deletion_requests IS 'Manages user data deletion requests for GDPR/CCPA compliance';
COMMENT ON TABLE security_incidents IS 'Tracks security incidents and response actions';
COMMENT ON TABLE incident_notifications IS 'Tracks notifications sent for security incidents';