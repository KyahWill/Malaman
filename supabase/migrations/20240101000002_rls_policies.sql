-- Row Level Security (RLS) Policies for Personalized LMS
-- This migration sets up comprehensive RLS policies for data access control

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

-- PROFILES TABLE POLICIES
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for registration)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Instructors and admins can view student profiles (for course management)
CREATE POLICY "Instructors can view student profiles" ON profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('instructor', 'admin')
    )
  );

-- COURSES TABLE POLICIES
-- Anyone can view published courses
CREATE POLICY "Anyone can view published courses" ON courses
  FOR SELECT USING (is_published = true);

-- Instructors can view and manage their own courses
CREATE POLICY "Instructors can manage own courses" ON courses
  FOR ALL USING (auth.uid() = instructor_id);

-- Students can view courses they are enrolled in (even if unpublished)
CREATE POLICY "Students can view enrolled courses" ON courses
  FOR SELECT USING (
    id IN (
      SELECT course_id FROM enrollments 
      WHERE student_id = auth.uid()
    )
  );

-- Admins can manage all courses
CREATE POLICY "Admins can manage all courses" ON courses
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- LESSONS TABLE POLICIES
-- Users can view lessons from courses they have access to
CREATE POLICY "Users can view accessible lessons" ON lessons
  FOR SELECT USING (
    course_id IN (
      SELECT id FROM courses WHERE 
        is_published = true OR 
        instructor_id = auth.uid() OR
        id IN (SELECT course_id FROM enrollments WHERE student_id = auth.uid()) OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    )
  );

-- Instructors can manage lessons in their courses
CREATE POLICY "Instructors can manage own course lessons" ON lessons
  FOR ALL USING (
    course_id IN (
      SELECT id FROM courses WHERE instructor_id = auth.uid()
    )
  );

-- Admins can manage all lessons
CREATE POLICY "Admins can manage all lessons" ON lessons
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- CONTENT_BLOCKS TABLE POLICIES
-- Users can view content blocks from lessons they have access to
CREATE POLICY "Users can view accessible content blocks" ON content_blocks
  FOR SELECT USING (
    lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE 
        c.is_published = true OR 
        c.instructor_id = auth.uid() OR
        c.id IN (SELECT course_id FROM enrollments WHERE student_id = auth.uid()) OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    )
  );

-- Instructors can manage content blocks in their course lessons
CREATE POLICY "Instructors can manage own course content blocks" ON content_blocks
  FOR ALL USING (
    lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE c.instructor_id = auth.uid()
    )
  );

-- Admins can manage all content blocks
CREATE POLICY "Admins can manage all content blocks" ON content_blocks
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- ENROLLMENTS TABLE POLICIES
-- Students can view and manage their own enrollments
CREATE POLICY "Students can manage own enrollments" ON enrollments
  FOR ALL USING (auth.uid() = student_id);

-- Instructors can view enrollments for their courses
CREATE POLICY "Instructors can view course enrollments" ON enrollments
  FOR SELECT USING (
    course_id IN (
      SELECT id FROM courses WHERE instructor_id = auth.uid()
    )
  );

-- Admins can manage all enrollments
CREATE POLICY "Admins can manage all enrollments" ON enrollments
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- ASSESSMENTS TABLE POLICIES
-- Users can view assessments from courses/lessons they have access to
CREATE POLICY "Users can view accessible assessments" ON assessments
  FOR SELECT USING (
    (lesson_id IS NOT NULL AND lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE 
        c.is_published = true OR 
        c.instructor_id = auth.uid() OR
        c.id IN (SELECT course_id FROM enrollments WHERE student_id = auth.uid()) OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    )) OR
    (course_id IS NOT NULL AND course_id IN (
      SELECT id FROM courses WHERE 
        is_published = true OR 
        instructor_id = auth.uid() OR
        id IN (SELECT course_id FROM enrollments WHERE student_id = auth.uid()) OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    ))
  );

-- Instructors can manage assessments in their courses
CREATE POLICY "Instructors can manage course assessments" ON assessments
  FOR ALL USING (
    (lesson_id IS NOT NULL AND lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE c.instructor_id = auth.uid()
    )) OR
    (course_id IS NOT NULL AND course_id IN (
      SELECT id FROM courses WHERE instructor_id = auth.uid()
    ))
  );

-- Admins can manage all assessments
CREATE POLICY "Admins can manage all assessments" ON assessments
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- ASSESSMENT_ATTEMPTS TABLE POLICIES
-- Students can view and create their own assessment attempts
CREATE POLICY "Students can manage own assessment attempts" ON assessment_attempts
  FOR ALL USING (auth.uid() = student_id);

-- Instructors can view attempts for their course assessments
CREATE POLICY "Instructors can view course assessment attempts" ON assessment_attempts
  FOR SELECT USING (
    assessment_id IN (
      SELECT a.id FROM assessments a
      LEFT JOIN lessons l ON a.lesson_id = l.id
      LEFT JOIN courses c1 ON l.course_id = c1.id
      LEFT JOIN courses c2 ON a.course_id = c2.id
      WHERE c1.instructor_id = auth.uid() OR c2.instructor_id = auth.uid()
    )
  );

-- Admins can view all assessment attempts
CREATE POLICY "Admins can view all assessment attempts" ON assessment_attempts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- STUDENT_PROGRESS TABLE POLICIES
-- Students can view and update their own progress
CREATE POLICY "Students can manage own progress" ON student_progress
  FOR ALL USING (auth.uid() = student_id);

-- Instructors can view progress for their courses
CREATE POLICY "Instructors can view course progress" ON student_progress
  FOR SELECT USING (
    course_id IN (
      SELECT id FROM courses WHERE instructor_id = auth.uid()
    )
  );

-- Admins can view all progress
CREATE POLICY "Admins can view all progress" ON student_progress
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- PERSONALIZED_ROADMAPS TABLE POLICIES
-- Students can view and update their own roadmaps
CREATE POLICY "Students can manage own roadmaps" ON personalized_roadmaps
  FOR ALL USING (auth.uid() = student_id);

-- Instructors can view roadmaps for students in their courses
CREATE POLICY "Instructors can view student roadmaps" ON personalized_roadmaps
  FOR SELECT USING (
    student_id IN (
      SELECT e.student_id FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE c.instructor_id = auth.uid()
    )
  );

-- Admins can view all roadmaps
CREATE POLICY "Admins can view all roadmaps" ON personalized_roadmaps
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- LEARNING_PROGRESS TABLE POLICIES
-- Students can manage their own learning progress
CREATE POLICY "Students can manage own learning progress" ON learning_progress
  FOR ALL USING (auth.uid() = student_id);

-- Instructors can view learning progress for students in their courses
CREATE POLICY "Instructors can view student learning progress" ON learning_progress
  FOR SELECT USING (
    student_id IN (
      SELECT e.student_id FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE c.instructor_id = auth.uid()
    )
  );

-- Admins can view all learning progress
CREATE POLICY "Admins can view all learning progress" ON learning_progress
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Create a function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();