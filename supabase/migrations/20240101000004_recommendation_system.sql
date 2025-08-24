-- Recommendation System Tables

-- Engagement patterns tracking
CREATE TABLE engagement_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  metrics JSONB NOT NULL,
  patterns TEXT[] DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content recommendations
CREATE TABLE content_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content_id UUID NOT NULL, -- Can reference lessons, courses, assessments
  content_type TEXT NOT NULL CHECK (content_type IN ('lesson', 'course', 'assessment')),
  score DECIMAL(3,2) NOT NULL CHECK (score >= 0 AND score <= 1),
  factors JSONB NOT NULL,
  explanation TEXT NOT NULL,
  viewed BOOLEAN DEFAULT FALSE,
  clicked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Recommendation feedback
CREATE TABLE recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content_id UUID NOT NULL,
  recommendation_id UUID REFERENCES content_recommendations(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful', 'irrelevant', 'too_easy', 'too_hard')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content interaction tracking
CREATE TABLE content_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'start', 'complete', 'pause', 'skip')),
  duration INTEGER, -- in seconds
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_engagement_patterns_student_id ON engagement_patterns(student_id);
CREATE INDEX idx_engagement_patterns_updated_at ON engagement_patterns(updated_at);

CREATE INDEX idx_content_recommendations_student_id ON content_recommendations(student_id);
CREATE INDEX idx_content_recommendations_content_id ON content_recommendations(content_id);
CREATE INDEX idx_content_recommendations_score ON content_recommendations(score DESC);
CREATE INDEX idx_content_recommendations_created_at ON content_recommendations(created_at);
CREATE INDEX idx_content_recommendations_expires_at ON content_recommendations(expires_at);

CREATE INDEX idx_recommendation_feedback_student_id ON recommendation_feedback(student_id);
CREATE INDEX idx_recommendation_feedback_recommendation_id ON recommendation_feedback(recommendation_id);
CREATE INDEX idx_recommendation_feedback_feedback_type ON recommendation_feedback(feedback_type);

CREATE INDEX idx_content_interactions_student_id ON content_interactions(student_id);
CREATE INDEX idx_content_interactions_content_id ON content_interactions(content_id);
CREATE INDEX idx_content_interactions_created_at ON content_interactions(created_at);

-- RLS Policies
ALTER TABLE engagement_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_interactions ENABLE ROW LEVEL SECURITY;

-- Students can view their own engagement patterns
CREATE POLICY "Students can view own engagement patterns" ON engagement_patterns
  FOR SELECT USING (auth.uid() = student_id);

-- Students can view their own recommendations
CREATE POLICY "Students can view own recommendations" ON content_recommendations
  FOR SELECT USING (auth.uid() = student_id);

-- Students can update their own recommendation views/clicks
CREATE POLICY "Students can update own recommendation interactions" ON content_recommendations
  FOR UPDATE USING (auth.uid() = student_id);

-- Students can provide feedback on recommendations
CREATE POLICY "Students can provide recommendation feedback" ON recommendation_feedback
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view own recommendation feedback" ON recommendation_feedback
  FOR SELECT USING (auth.uid() = student_id);

-- Students can create their own content interactions
CREATE POLICY "Students can create own content interactions" ON content_interactions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view own content interactions" ON content_interactions
  FOR SELECT USING (auth.uid() = student_id);

-- Instructors can view aggregated data for their courses
CREATE POLICY "Instructors can view course recommendation data" ON content_recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses c
      JOIN lessons l ON c.id = l.course_id
      WHERE l.id = content_id::uuid
      AND c.instructor_id = auth.uid()
    )
  );

-- Function to update engagement patterns
CREATE OR REPLACE FUNCTION update_engagement_patterns()
RETURNS TRIGGER AS $$
BEGIN
  -- This would be called when student progress is updated
  -- to recalculate engagement patterns
  INSERT INTO engagement_patterns (student_id, metrics, patterns, preferences)
  SELECT 
    NEW.student_id,
    '{}',
    '{}',
    '{}'
  ON CONFLICT (student_id) DO UPDATE SET
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired recommendations
CREATE OR REPLACE FUNCTION cleanup_expired_recommendations()
RETURNS void AS $$
BEGIN
  DELETE FROM content_recommendations 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup function (would need pg_cron extension in production)
-- SELECT cron.schedule('cleanup-recommendations', '0 2 * * *', 'SELECT cleanup_expired_recommendations();');