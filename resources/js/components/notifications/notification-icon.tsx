import {
    Award,
    Bell,
    BookOpen,
    Building2,
    Calendar,
    CalendarCheck,
    CheckCircle2,
    ClipboardCheck,
    Clock,
    CreditCard,
    FileText,
    GraduationCap,
    Megaphone,
    Settings,
    Sparkles,
    UserCheck,
    UserPlus,
    UserX,
    Users,
} from 'lucide-react';

export function NotificationIcon({
    icon,
    category,
    className = 'size-4',
}: {
    icon?: string;
    category?: string;
    className?: string;
}) {
    switch (icon) {
        case 'credit-card':
            return <CreditCard className={className} />;
        case 'check-circle':
            return <CheckCircle2 className={className} />;
        case 'clock':
            return <Clock className={className} />;
        case 'calendar':
        case 'calendar-x':
            return <Calendar className={className} />;
        case 'calendar-check':
            return <CalendarCheck className={className} />;
        case 'user-x':
            return <UserX className={className} />;
        case 'user-plus':
            return <UserPlus className={className} />;
        case 'user-check':
            return <UserCheck className={className} />;
        case 'users':
            return <Users className={className} />;
        case 'clipboard-check':
            return <ClipboardCheck className={className} />;
        case 'file-text':
            return <FileText className={className} />;
        case 'graduation-cap':
            return <GraduationCap className={className} />;
        case 'award':
            return <Award className={className} />;
        case 'book-open':
            return <BookOpen className={className} />;
        case 'megaphone':
            return <Megaphone className={className} />;
        case 'settings':
            return <Settings className={className} />;
        case 'sparkles':
            return <Sparkles className={className} />;
    }

    switch (category) {
        case 'fees':
            return <CreditCard className={className} />;
        case 'attendance':
            return <ClipboardCheck className={className} />;
        case 'timetable':
            return <Clock className={className} />;
        case 'academics':
            return <GraduationCap className={className} />;
        case 'assignments':
            return <FileText className={className} />;
        case 'announcements':
            return <Megaphone className={className} />;
        case 'organization_activity':
            return <Building2 className={className} />;
        default:
            return <Bell className={className} />;
    }
}

