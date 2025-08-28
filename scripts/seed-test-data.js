#!/usr/bin/env node

/**
 * Test Data Seeding Script
 * 
 * This script seeds the test database with sample data for testing purposes.
 * It creates users, courses, lessons, assessments, and progress data.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { testUsers, testCourses, testAssessments, testProgressData, testAssessmentAttempts, testRoadmaps } from '../tests/fixtures/test-data.js';

// Load environment variables
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Missing Supabase key. Set SUPABASE_SERVICE_ROLE_KEY or PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedUsers() {
  console.log('🌱 Seeding users...');
  
  const users = Object.values(testUsers);
  
  for (const user of users) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        first_name: user.profile.first_name,
        last_name: user.profile.last_name,
        role: user.role
      }
    });

    if (authError) {
      console.warn(`⚠️  Auth user creation failed for ${user.email}:`, authError.message);
      continue;
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: user.email,
        role: user.role,
        first_name: user.profile.first_name,
        last_name: user.profile.last_name,
        learning_preferences: user.profile.learning_preferences,
        knowledge_profile: user.profile.knowledge_profile
      });

    if (profileError) {
      console.warn(`⚠️  Profile creation failed for ${user.email}:`, profileError.message);
    } else {
      console.log(`✅ Created user: ${user.email}`);
    }
  }
}

async function seedCourses() {
  console.log('🌱 Seeding courses...');
  
  // Get instructor user ID
  const { data: instructor } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', testUsers.instructor.email)
    .single();

  if (!instructor) {
    console.error('❌ Instructor not found. Cannot seed courses.');
    return;
  }

  for (const course of testCourses) {
    // Create course
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert({
        id: course.id,
        title: course.title,
        description: course.description,
        instructor_id: instructor.id,
        difficulty_level: course.difficulty_level,
        estimated_duration: course.estimated_duration,
        tags: course.tags,
        is_published: course.is_published
      })
      .select()
      .single();

    if (courseError) {
      console.warn(`⚠️  Course creation failed for ${course.title}:`, courseError.message);
      continue;
    }

    console.log(`✅ Created course: ${course.title}`);

    // Create lessons
    for (const lesson of course.lessons || []) {
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          id: lesson.id,
          course_id: courseData.id,
          title: lesson.title,
          description: lesson.description,
          order_index: lesson.order_index,
          estimated_duration: lesson.estimated_duration,
          prerequisites: lesson.prerequisites || [],
          is_published: true
        })
        .select()
        .single();

      if (lessonError) {
        console.warn(`⚠️  Lesson creation failed for ${lesson.title}:`, lessonError.message);
        continue;
      }

      console.log(`  ✅ Created lesson: ${lesson.title}`);

      // Create content blocks
      for (const block of lesson.content_blocks || []) {
        const { error: blockError } = await supabase
          .from('content_blocks')
          .insert({
            id: block.id,
            lesson_id: lessonData.id,
            type: block.type,
            content: block.content,
            order_index: block.order_index,
            metadata: {}
          });

        if (blockError) {
          console.warn(`⚠️  Content block creation failed:`, blockError.message);
        }
      }
    }
  }
}

async function seedAssessments() {
  console.log('🌱 Seeding assessments...');
  
  for (const assessment of testAssessments) {
    const { error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        id: assessment.id,
        lesson_id: assessment.lesson_id,
        title: assessment.title,
        description: assessment.description,
        questions: assessment.questions,
        minimum_passing_score: assessment.minimum_passing_score,
        time_limit: assessment.time_limit,
        max_attempts: assessment.max_attempts,
        ai_generated: assessment.ai_generated,
        is_mandatory: true
      });

    if (assessmentError) {
      console.warn(`⚠️  Assessment creation failed for ${assessment.title}:`, assessmentError.message);
    } else {
      console.log(`✅ Created assessment: ${assessment.title}`);
    }
  }

  // Update lessons with assessment IDs
  for (const course of testCourses) {
    for (const lesson of course.lessons || []) {
      if (lesson.assessment_id) {
        await supabase
          .from('lessons')
          .update({ assessment_id: lesson.assessment_id })
          .eq('id', lesson.id);
      }
    }
  }
}

async function seedEnrollments() {
  console.log('🌱 Seeding enrollments...');
  
  // Get student user ID
  const { data: student } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', testUsers.student.email)
    .single();

  if (!student) {
    console.error('❌ Student not found. Cannot seed enrollments.');
    return;
  }

  // Enroll student in first course
  const { error: enrollmentError } = await supabase
    .from('enrollments')
    .insert({
      student_id: student.id,
      course_id: testCourses[0].id,
      enrolled_at: new Date().toISOString()
    });

  if (enrollmentError) {
    console.warn(`⚠️  Enrollment creation failed:`, enrollmentError.message);
  } else {
    console.log(`✅ Enrolled student in course: ${testCourses[0].title}`);
  }
}

async function seedProgress() {
  console.log('🌱 Seeding progress data...');
  
  // Get student user ID
  const { data: student } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', testUsers.student.email)
    .single();

  if (!student) {
    console.error('❌ Student not found. Cannot seed progress.');
    return;
  }

  for (const progress of testProgressData) {
    const { error: progressError } = await supabase
      .from('student_progress')
      .insert({
        ...progress,
        student_id: student.id
      });

    if (progressError) {
      console.warn(`⚠️  Progress creation failed:`, progressError.message);
    }
  }

  console.log(`✅ Created ${testProgressData.length} progress records`);
}

async function seedAssessmentAttempts() {
  console.log('🌱 Seeding assessment attempts...');
  
  // Get student user ID
  const { data: student } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', testUsers.student.email)
    .single();

  if (!student) {
    console.error('❌ Student not found. Cannot seed assessment attempts.');
    return;
  }

  for (const attempt of testAssessmentAttempts) {
    const { error: attemptError } = await supabase
      .from('assessment_attempts')
      .insert({
        ...attempt,
        student_id: student.id
      });

    if (attemptError) {
      console.warn(`⚠️  Assessment attempt creation failed:`, attemptError.message);
    }
  }

  console.log(`✅ Created ${testAssessmentAttempts.length} assessment attempts`);
}

async function seedRoadmaps() {
  console.log('🌱 Seeding personalized roadmaps...');
  
  // Get student user ID
  const { data: student } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', testUsers.student.email)
    .single();

  if (!student) {
    console.error('❌ Student not found. Cannot seed roadmaps.');
    return;
  }

  for (const roadmap of testRoadmaps) {
    const { error: roadmapError } = await supabase
      .from('personalized_roadmaps')
      .insert({
        ...roadmap,
        student_id: student.id
      });

    if (roadmapError) {
      console.warn(`⚠️  Roadmap creation failed:`, roadmapError.message);
    }
  }

  console.log(`✅ Created ${testRoadmaps.length} personalized roadmaps`);
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up existing test data...');
  
  // Delete in reverse dependency order
  await supabase.from('personalized_roadmaps').delete().neq('id', '');
  await supabase.from('assessment_attempts').delete().neq('id', '');
  await supabase.from('student_progress').delete().neq('id', '');
  await supabase.from('enrollments').delete().neq('id', '');
  await supabase.from('content_blocks').delete().neq('id', '');
  await supabase.from('assessments').delete().neq('id', '');
  await supabase.from('lessons').delete().neq('id', '');
  await supabase.from('courses').delete().neq('id', '');
  await supabase.from('profiles').delete().neq('id', '');
  
  // Delete auth users
  const { data: users } = await supabase.auth.admin.listUsers();
  for (const user of users.users || []) {
    if (Object.values(testUsers).some(testUser => testUser.email === user.email)) {
      await supabase.auth.admin.deleteUser(user.id);
    }
  }
  
  console.log('✅ Cleanup completed');
}

async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'seed':
        console.log('🚀 Starting test data seeding...');
        await seedUsers();
        await seedCourses();
        await seedAssessments();
        await seedEnrollments();
        await seedProgress();
        await seedAssessmentAttempts();
        await seedRoadmaps();
        console.log('🎉 Test data seeding completed successfully!');
        break;
        
      case 'cleanup':
        await cleanupTestData();
        console.log('🎉 Test data cleanup completed!');
        break;
        
      case 'reset':
        await cleanupTestData();
        console.log('🚀 Starting fresh test data seeding...');
        await seedUsers();
        await seedCourses();
        await seedAssessments();
        await seedEnrollments();
        await seedProgress();
        await seedAssessmentAttempts();
        await seedRoadmaps();
        console.log('🎉 Test data reset completed successfully!');
        break;
        
      default:
        console.log('Usage: node scripts/seed-test-data.js [seed|cleanup|reset]');
        console.log('  seed    - Add test data to database');
        console.log('  cleanup - Remove all test data');
        console.log('  reset   - Remove and re-add test data');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error during operation:', error);
    process.exit(1);
  }
}

main();