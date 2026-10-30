import type {
    BenefitItem,
    Course,
    HowItWorksStep,
    TestimonialItem,
} from './course-types';

export const SAMPLE_COURSES: Course[] = [
    {
        id: 'course-1',
        title: 'Full-Stack Modern Web Engineering: Laravel, React & TypeScript',
        slug: 'fullstack-laravel-react-typescript',
        category: 'Development',
        level: 'Advanced',
        duration: '10 Weeks',
        lessonsCount: 48,
        rating: 4.95,
        reviewsCount: 1420,
        description:
            'Architect scalable SaaS platforms with Laravel 13 backend services, React 19 Inertia single-page architecture, and strict TypeScript types.',
        instructor: {
            name: 'Elena Rostova',
            role: 'Principal Solutions Architect',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        },
        gradient: 'from-blue-600 via-[#1769E0] to-[#0B1528]',
        accentColor: '#1769E0',
        popular: true,
        featured: true,
        price: 'Included with Pro',
        tags: ['Laravel', 'React', 'TypeScript', 'Tailwind CSS'],
    },
    {
        id: 'course-2',
        title: 'Applied AI & LLM Systems: Production RAG to Fine-Tuning',
        slug: 'applied-ai-llm-systems',
        category: 'AI & Data',
        level: 'Advanced',
        duration: '8 Weeks',
        lessonsCount: 36,
        rating: 4.98,
        reviewsCount: 2180,
        description:
            'Build enterprise-ready AI agents, retrieval-augmented generation pipelines, vector databases, and evaluation frameworks with modern Python tooling.',
        instructor: {
            name: 'Dr. Aris Thorne',
            role: 'Head of Applied AI Research',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        },
        gradient: 'from-[#0B1528] via-slate-800 to-[#1769E0]',
        accentColor: '#1769E0',
        popular: true,
        featured: true,
        price: 'Included with Pro',
        tags: ['LangChain', 'Python', 'Vector DB', 'OpenAI'],
    },
    {
        id: 'course-3',
        title: 'Design Systems & Enterprise Product UI/UX Architecture',
        slug: 'design-systems-enterprise-ui-ux',
        category: 'Design',
        level: 'Intermediate',
        duration: '6 Weeks',
        lessonsCount: 32,
        rating: 4.88,
        reviewsCount: 980,
        description:
            'Master design tokens, Figma component architectures, accessibility standards (WCAG AAA), and cross-functional handoff protocols for large teams.',
        instructor: {
            name: 'Marcus Chen',
            role: 'Design Director & UX Strategist',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        },
        gradient: 'from-sky-700 via-blue-800 to-[#0B1528]',
        accentColor: '#0284C7',
        featured: false,
        price: 'Included with Pro',
        tags: ['Figma', 'Design Systems', 'WCAG', 'Typography'],
    },
    {
        id: 'course-4',
        title: 'Cloud-Native DevOps: Kubernetes, Terraform & GitOps CI/CD',
        slug: 'cloud-native-devops-kubernetes-terraform',
        category: 'DevOps & Cloud',
        level: 'Intermediate',
        duration: '8 Weeks',
        lessonsCount: 40,
        rating: 4.91,
        reviewsCount: 1120,
        description:
            'Deploy, monitor, and scale multi-region infrastructure using declarative Terraform configs, Kubernetes Helm charts, and automated GitHub Actions workflows.',
        instructor: {
            name: 'Sarah Jenkins',
            role: 'Staff Infrastructure Engineer',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        },
        gradient: 'from-slate-800 via-blue-900 to-[#0B1528]',
        accentColor: '#1E3A8A',
        featured: false,
        price: 'Included with Pro',
        tags: ['Kubernetes', 'Docker', 'AWS', 'Terraform'],
    },
    {
        id: 'course-5',
        title: 'High-Performance Data Engineering with Apache Spark & BigQuery',
        slug: 'data-engineering-spark-bigquery',
        category: 'AI & Data',
        level: 'Intermediate',
        duration: '7 Weeks',
        lessonsCount: 34,
        rating: 4.92,
        reviewsCount: 840,
        description:
            'Construct robust streaming and batch data pipelines, perform delta lake operations, and optimize analytical SQL queries for petabyte-scale datasets.',
        instructor: {
            name: 'Vikram Patel',
            role: 'Data Platform Architect',
            avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        },
        gradient: 'from-blue-700 via-[#1769E0] to-slate-900',
        accentColor: '#1769E0',
        featured: false,
        price: 'Included with Pro',
        tags: ['Spark', 'BigQuery', 'SQL', 'Data Pipelines'],
    },
    {
        id: 'course-6',
        title: 'Defensive Application Security & Cloud Threat Modeling',
        slug: 'defensive-appsec-cloud-threat-modeling',
        category: 'Security',
        level: 'Advanced',
        duration: '9 Weeks',
        lessonsCount: 42,
        rating: 4.96,
        reviewsCount: 750,
        description:
            'Harden web applications against OWASP Top 10 vulnerabilities, configure OAuth2/OIDC zero-trust identity pipelines, and lead forensic security reviews.',
        instructor: {
            name: 'Maya Lin',
            role: 'Lead Security Researcher',
            avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        },
        gradient: 'from-teal-800 via-slate-800 to-[#0B1528]',
        accentColor: '#0D9488',
        featured: false,
        price: 'Included with Pro',
        tags: ['AppSec', 'OAuth2', 'OWASP', 'Penetration Testing'],
    },
];

export const BENEFITS: BenefitItem[] = [
    {
        id: 'benefit-1',
        title: 'Expert-Led Learning',
        description:
            'Learn directly from active staff engineers, principal architects, and technical directors building systems at top global technology companies.',
        iconName: 'GraduationCap',
        statsLabel: 'Top 1% Practitioners',
    },
    {
        id: 'benefit-2',
        title: 'Flexible & Self-Paced Schedule',
        description:
            'Enjoy unrestricted lifetime access. Absorb structured video lectures, deep-dive architectural breakdowns, and downloadable project templates at your own pace.',
        iconName: 'Clock',
        statsLabel: '100% On-Demand Access',
    },
    {
        id: 'benefit-3',
        title: 'Interactive Progress Tracking',
        description:
            'Stay accountable with real-time milestone checks, conceptual quizzes, code checkpoint reviews, and verifiable digital certificates upon curriculum completion.',
        iconName: 'TrendingUp',
        statsLabel: 'Continuous Verification',
    },
    {
        id: 'benefit-4',
        title: 'Practical Skills & Career Growth',
        description:
            'Build full-stack production capstone systems you can proudly showcase to hiring managers, with architectural guidance and career roadmap assistance.',
        iconName: 'Briefcase',
        statsLabel: 'Portfolio-Ready Artifacts',
    },
];

export const HOW_IT_WORKS: HowItWorksStep[] = [
    {
        step: '01',
        title: 'Get Started with Your Account',
        description:
            'Join in less than a minute. As a student member, you immediately unlock our introductory modules, interactive syllabus guides, and developer sandbox.',
        detail: 'Instant student access with no credit card required.',
    },
    {
        step: '02',
        title: 'Explore & Select Your Track',
        description:
            'Filter by specialization, experience level, or target career goal. Select high-yield curriculums tailored from software engineering to artificial intelligence.',
        detail: 'Detailed syllabus outlines, prerequisites & learning objectives.',
    },
    {
        step: '03',
        title: 'Learn Through Real-World Lessons',
        description:
            'Work through modular chapters featuring crystal-clear explanations, architectural diagrams, downloadable starter repos, and hands-on coding challenges.',
        detail: 'Bite-sized high-retention video lessons & deep-dive readings.',
    },
    {
        step: '04',
        title: 'Track Progress & Certify',
        description:
            'Complete guided milestone projects, submit capstones for automated or peer review, and receive cryptographically signed certificates for LinkedIn and your resume.',
        detail: 'Shareable proof of mastery and portfolio achievements.',
    },
];

export const TESTIMONIALS: TestimonialItem[] = [
    {
        id: 'test-1',
        name: 'Jordan Miller',
        role: 'Senior Software Engineer',
        company: 'CloudScale Technologies',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        quote: 'The Laravel & React architecture course completely transformed how our team structures Inertia applications. The focus on real-world patterns instead of toy examples is unmatched.',
        courseTaken: 'Full-Stack Modern Web Engineering',
        rating: 5,
    },
    {
        id: 'test-2',
        name: 'Amina Al-Mansoor',
        role: 'AI Product Specialist',
        company: 'Vanguard Systems',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        quote: 'I went from struggling with disjointed AI tutorials to deploying production RAG microservices with vector search in under 4 weeks. Best investment in my engineering career.',
        courseTaken: 'Applied AI & LLM Systems',
        rating: 5,
    },
    {
        id: 'test-3',
        name: 'David Kasparov',
        role: 'Lead UI/UX Designer',
        company: 'Apex Digital Studio',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
        quote: 'The design systems modules bridged the communication chasm between our product design team and front-end engineering staff. Truly world-class instruction.',
        courseTaken: 'Design Systems Architecture',
        rating: 5,
    },
];

export const PLATFORM_STATS = [
    {
        value: '250+',
        label: 'Structured Lessons',
        subtext: 'Updated regularly',
    },
    {
        value: '48,000+',
        label: 'Active Students',
        subtext: 'Across 120+ countries',
    },
    {
        value: '96%',
        label: 'Completion Rate',
        subtext: 'Cohort-proven curriculum',
    },
    {
        value: '4.95 / 5',
        label: 'Average Rating',
        subtext: 'Based on 7,000+ reviews',
    },
];
