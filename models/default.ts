interface IMeal {
    id: number;
    name: string;
    price: number;
    description: string;
    image: string;
    category?: string;
    type: number;
}

interface ICategory {
    id: number;
    name: string;
}

interface IProfile {
    id: string;
    user_id: string;
    username: string;
    email: string;
    role: EUserRole;
    created_at: string;
    options: IOptions;
    avatar_url?: string;
    dietary_preferences?: {
        vegetarian: boolean;
        vegan: boolean;
        gluten_free: boolean;
        dairy_free: boolean;
        nut_free: boolean;
    };
}

interface IOptions {
    autoLogout: boolean;
    enableNotifications: boolean;
    enableDarkMode: boolean;
}

interface IPrediction {
    id: number;
    breakfast: number;
    lunch: number;
    dinner: number;
    date: Date;
}

interface IMealHistory {
    id: number;
    meal_id: number;
    meal_type: 'breakfast' | 'lunch' | 'dinner';
    date: string;
    quantity: number;
    cost: number;
    meal?: IMeal;
}

interface INotification {
    id: number;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    read: boolean;
    created_at: string;
}

enum EUserRole {
    TEACHER = "teacher",
    FOOD_PROVIDER = "food_provider",
    ADMIN = "admin",
}

export { EUserRole }
export type { IMeal, ICategory, IProfile, IOptions, IPrediction, IMealHistory, INotification };