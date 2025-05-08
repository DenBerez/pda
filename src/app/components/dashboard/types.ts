export type WidgetType = 'text' | 'custom' | 'weather' | 'email' | 'social' | 'calendar' | 'news' | 'music' | 'photos' | 'slideshow' | 'spotify';

export interface Widget {
    id: string;
    type: WidgetType;
    title: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    config?: {
        city?: string;
        images?: Array<{ url: string, caption?: string }>;
        interval?: number;
        showCaptions?: boolean;
        showControls?: boolean;
        transition?: 'fade' | 'slide';
        refreshToken?: string;
        refreshInterval?: number;
        [key: string]: any;
    };
    content?: string;
}

export interface DashboardSettings {
    editMode: boolean;
    darkMode: boolean;
    layout: Layouts;
    widgets: Widget[];
    primaryColor: string;
}

export interface Layouts {
    [breakpoint: string]: LayoutItem[];
}


export interface LayoutItem {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface EmailConfig {
    provider: 'gmail' | 'aol';
    email?: string;
    refreshToken?: string;
    password?: string;
}

export interface WeatherConfig {
    city: string;
    units?: 'celsius' | 'fahrenheit';
    refreshRate?: number;
    layoutOption?: 'compact' | 'normal' | 'detailed';
}

export interface CalendarConfig {
    showWeekends: boolean;
    firstDayOfWeek?: number;
    dateFormat?: 'short' | 'medium' | 'long';
    colorTheme?: string;
    showEvents?: boolean;
    maxEvents?: number;
    calendarRefreshToken?: string;
    showCalendarGrid?: boolean;
}

export interface SocialConfig {
    platform: 'twitter' | 'facebook' | 'instagram';
    username: string;
}

export interface CustomConfig {
    url: string;
}

export interface TextConfig {
    text: string;
}

export interface WidgetConfig {
    [key: string]: any;
}

export interface SpotifyConfig {
    refreshToken?: string;
    refreshInterval?: number;
    layoutOption?: 'compact' | 'normal' | 'detailed';
}
