export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type CourseCategory =
    | 'All'
    | 'Development'
    | 'AI & Data'
    | 'Design'
    | 'DevOps & Cloud'
    | 'Security';

export interface Course {
    id: string;
    title: string;
    slug: string;
    category: CourseCategory;
    level: CourseLevel;
    duration: string;
    lessonsCount: number;
    rating: number;
    reviewsCount: number;
    description: string;
    instructor: {
        name: string;
        role: string;
        avatar: string;
    };
    gradient: string;
    accentColor: string;
    popular?: boolean;
    featured?: boolean;
    price: string;
    tags: string[];
}

export interface BenefitItem {
    id: string;
    title: string;
    description: string;
    iconName: string;
    statsLabel?: string;
}

export interface HowItWorksStep {
    step: string;
    title: string;
    description: string;
    detail: string;
}

export interface TestimonialItem {
    id: string;
    name: string;
    role: string;
    company: string;
    avatar: string;
    quote: string;
    courseTaken: string;
    rating: number;
}
