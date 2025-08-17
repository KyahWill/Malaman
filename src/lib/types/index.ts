/**
 * Core type definitions for the Personalized LMS
 */

export type UserRole = 'student' | 'instructor' | 'admin';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type ContentType = 'rich_text' | 'image' | 'video' | 'file' | 'youtube';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';
export type RoadmapStatus = 'active' | 'completed' | 'paused';

export interface User {
	id: string;
	email: string;
	role: UserRole;
	profile: UserProfile;
	created_at: string;
	updated_at: string;
}

export interface UserProfile {
	id: string;
	email: string;
	role: UserRole;
	first_name: string;
	last_name: string;
	avatar_url?: string;
	learning_preferences: LearningPreferences;
	knowledge_profile: KnowledgeProfile;
	created_at: string;
	updated_at: string;
}

export interface LearningPreferences {
	preferred_pace: 'slow' | 'medium' | 'fast';
	preferred_media_types: ContentType[];
	learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
}

export interface KnowledgeProfile {
	subject_areas: SubjectKnowledge[];
	skill_levels: SkillLevel[];
	last_assessed: string;
}

export interface SubjectKnowledge {
	subject: string;
	level: number; // 1-5 scale
	confidence: number; // 1-5 scale
}

export interface SkillLevel {
	skill: string;
	level: DifficultyLevel;
	verified: boolean;
}

export interface Course {
	id: string;
	title: string;
	description: string;
	instructor_id: string;
	lessons: Lesson[];
	final_assessment_id: string;
	tags: string[];
	difficulty_level: DifficultyLevel;
	estimated_duration: number;
	is_published: boolean;
	created_at: string;
	updated_at: string;
}

export interface Lesson {
	id: string;
	course_id: string;
	title: string;
	description: string;
	order_index: number;
	content_blocks: ContentBlock[];
	learning_objectives: string[];
	estimated_duration: number;
	assessment_id: string;
	prerequisites: string[];
	is_published: boolean;
	created_at: string;
	updated_at: string;
}

export interface ContentBlock {
	id: string;
	lesson_id: string;
	type: ContentType;
	content: ContentData;
	order_index: number;
	metadata: ContentMetadata;
}

export interface ContentData {
	rich_text?: {
		html: string;
		plain_text: string;
	};
	image?: {
		url: string;
		alt_text: string;
		caption?: string;
	};
	video?: {
		url: string;
		thumbnail_url?: string;
		duration?: number;
	};
	file?: {
		url: string;
		filename: string;
		file_type: string;
		file_size: number;
	};
	youtube?: {
		video_id: string;
		title: string;
		thumbnail_url: string;
		duration: number;
	};
}

export interface ContentMetadata {
	accessibility?: {
		alt_text?: string;
		captions?: boolean;
		transcript?: string;
	};
	tags?: string[];
	difficulty?: DifficultyLevel;
}

export interface Assessment {
	id: string;
	lesson_id?: string;
	course_id?: string;
	title: string;
	description: string;
	questions: Question[];
	ai_generated: boolean;
	source_content_ids: string[];
	is_mandatory: boolean;
	minimum_passing_score: number;
	max_attempts?: number;
	time_limit?: number;
	created_at: string;
	updated_at: string;
}

export interface Question {
	id: string;
	type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
	question_text: string;
	options?: string[];
	correct_answer: string | string[];
	explanation: string;
	difficulty_level: number;
	topics: string[];
	points: number;
}

export interface StudentProgress {
	id: string;
	student_id: string;
	course_id: string;
	lesson_id?: string;
	assessment_id?: string;
	status: ProgressStatus;
	completion_percentage: number;
	last_accessed: string;
	time_spent: number;
	attempts_count: number;
	best_score?: number;
	created_at: string;
	updated_at: string;
}