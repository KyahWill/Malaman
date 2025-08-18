import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
	throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Database type definitions
export type UserRole = 'student' | 'instructor' | 'admin';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type ContentType = 'rich_text' | 'image' | 'video' | 'file' | 'youtube';
export type RoadmapStatus = 'active' | 'completed' | 'paused';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string;
					email: string;
					role: UserRole;
					first_name: string | null;
					last_name: string | null;
					avatar_url: string | null;
					learning_preferences: any | null;
					knowledge_profile: any | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					email: string;
					role?: UserRole;
					first_name?: string | null;
					last_name?: string | null;
					avatar_url?: string | null;
					learning_preferences?: any | null;
					knowledge_profile?: any | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					email?: string;
					role?: UserRole;
					first_name?: string | null;
					last_name?: string | null;
					avatar_url?: string | null;
					learning_preferences?: any | null;
					knowledge_profile?: any | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			courses: {
				Row: {
					id: string;
					title: string;
					description: string | null;
					instructor_id: string;
					final_assessment_id: string | null;
					tags: string[];
					difficulty_level: DifficultyLevel;
					estimated_duration: number;
					is_published: boolean;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					title: string;
					description?: string | null;
					instructor_id: string;
					final_assessment_id?: string | null;
					tags?: string[];
					difficulty_level?: DifficultyLevel;
					estimated_duration?: number;
					is_published?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					title?: string;
					description?: string | null;
					instructor_id?: string;
					final_assessment_id?: string | null;
					tags?: string[];
					difficulty_level?: DifficultyLevel;
					estimated_duration?: number;
					is_published?: boolean;
					created_at?: string;
					updated_at?: string;
				};
			};
			lessons: {
				Row: {
					id: string;
					course_id: string;
					title: string;
					description: string | null;
					order_index: number;
					learning_objectives: string[];
					estimated_duration: number;
					assessment_id: string | null;
					prerequisites: string[];
					is_published: boolean;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					course_id: string;
					title: string;
					description?: string | null;
					order_index: number;
					learning_objectives?: string[];
					estimated_duration?: number;
					assessment_id?: string | null;
					prerequisites?: string[];
					is_published?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					course_id?: string;
					title?: string;
					description?: string | null;
					order_index?: number;
					learning_objectives?: string[];
					estimated_duration?: number;
					assessment_id?: string | null;
					prerequisites?: string[];
					is_published?: boolean;
					created_at?: string;
					updated_at?: string;
				};
			};
			content_blocks: {
				Row: {
					id: string;
					lesson_id: string;
					type: ContentType;
					content: any;
					order_index: number;
					metadata: any;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					lesson_id: string;
					type: ContentType;
					content: any;
					order_index: number;
					metadata?: any;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					lesson_id?: string;
					type?: ContentType;
					content?: any;
					order_index?: number;
					metadata?: any;
					created_at?: string;
					updated_at?: string;
				};
			};
			enrollments: {
				Row: {
					id: string;
					student_id: string;
					course_id: string;
					enrolled_at: string;
					completed_at: string | null;
					progress: any;
				};
				Insert: {
					id?: string;
					student_id: string;
					course_id: string;
					enrolled_at?: string;
					completed_at?: string | null;
					progress?: any;
				};
				Update: {
					id?: string;
					student_id?: string;
					course_id?: string;
					enrolled_at?: string;
					completed_at?: string | null;
					progress?: any;
				};
			};
			assessments: {
				Row: {
					id: string;
					lesson_id: string | null;
					course_id: string | null;
					title: string;
					description: string | null;
					questions: any;
					ai_generated: boolean;
					source_content_ids: string[];
					is_mandatory: boolean;
					minimum_passing_score: number;
					max_attempts: number | null;
					time_limit: number | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					lesson_id?: string | null;
					course_id?: string | null;
					title: string;
					description?: string | null;
					questions?: any;
					ai_generated?: boolean;
					source_content_ids?: string[];
					is_mandatory?: boolean;
					minimum_passing_score?: number;
					max_attempts?: number | null;
					time_limit?: number | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					lesson_id?: string | null;
					course_id?: string | null;
					title?: string;
					description?: string | null;
					questions?: any;
					ai_generated?: boolean;
					source_content_ids?: string[];
					is_mandatory?: boolean;
					minimum_passing_score?: number;
					max_attempts?: number | null;
					time_limit?: number | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			assessment_attempts: {
				Row: {
					id: string;
					assessment_id: string;
					student_id: string;
					attempt_number: number;
					answers: any;
					score: number;
					points_earned: number;
					total_points: number;
					passed: boolean;
					time_spent: number;
					started_at: string;
					submitted_at: string;
					feedback: any;
				};
				Insert: {
					id?: string;
					assessment_id: string;
					student_id: string;
					attempt_number: number;
					answers?: any;
					score?: number;
					points_earned?: number;
					total_points?: number;
					passed?: boolean;
					time_spent?: number;
					started_at?: string;
					submitted_at?: string;
					feedback?: any;
				};
				Update: {
					id?: string;
					assessment_id?: string;
					student_id?: string;
					attempt_number?: number;
					answers?: any;
					score?: number;
					points_earned?: number;
					total_points?: number;
					passed?: boolean;
					time_spent?: number;
					started_at?: string;
					submitted_at?: string;
					feedback?: any;
				};
			};
			student_progress: {
				Row: {
					id: string;
					student_id: string;
					course_id: string;
					lesson_id: string | null;
					assessment_id: string | null;
					status: ProgressStatus;
					completion_percentage: number;
					last_accessed: string;
					time_spent: number;
					attempts_count: number;
					best_score: number | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					student_id: string;
					course_id: string;
					lesson_id?: string | null;
					assessment_id?: string | null;
					status?: ProgressStatus;
					completion_percentage?: number;
					last_accessed?: string;
					time_spent?: number;
					attempts_count?: number;
					best_score?: number | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					student_id?: string;
					course_id?: string;
					lesson_id?: string | null;
					assessment_id?: string | null;
					status?: ProgressStatus;
					completion_percentage?: number;
					last_accessed?: string;
					time_spent?: number;
					attempts_count?: number;
					best_score?: number | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			personalized_roadmaps: {
				Row: {
					id: string;
					student_id: string;
					roadmap_data: any;
					ai_reasoning: string | null;
					status: RoadmapStatus;
					generated_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					student_id: string;
					roadmap_data: any;
					ai_reasoning?: string | null;
					status?: RoadmapStatus;
					generated_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					student_id?: string;
					roadmap_data?: any;
					ai_reasoning?: string | null;
					status?: RoadmapStatus;
					generated_at?: string;
					updated_at?: string;
				};
			};
			learning_progress: {
				Row: {
					id: string;
					student_id: string;
					content_id: string;
					content_type: string;
					progress_data: any;
					completed_at: string | null;
					time_spent: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					student_id: string;
					content_id: string;
					content_type: string;
					progress_data: any;
					completed_at?: string | null;
					time_spent?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					student_id?: string;
					content_id?: string;
					content_type?: string;
					progress_data?: any;
					completed_at?: string | null;
					time_spent?: number;
					created_at?: string;
					updated_at?: string;
				};
			};
		};
	};
}

export const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true
	}
});