import { supabase } from "@/services/auth.service";
import { ICategory, IMeal, IMealHistory, INotification, IPrediction, IProfile } from "@/models/default";

const dbService = {
    async getProfile(userId: string): Promise<IProfile> {
        const { data, error } = await supabase.from('users').select('*').eq('user_id', userId).single();
        if (error) throw error;
        return data;
    },

    async updateProfile(userId: string, profile: Partial<IProfile>): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update(profile)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async updateAvatar(userId: string, file: File): Promise<string> {
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}-${Math.random()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('user-content')
            .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from('user-content')
            .getPublicUrl(filePath)

        await this.updateProfile(userId, { avatar_url: publicUrl })
        
        return publicUrl
    },

    async updatePassword(email: string, password: string): Promise<void> {
        const { error } = await supabase.auth.updateUser({
            password: password
        })
        if (error) throw error;
    },

    async getCategories(): Promise<ICategory[]> {
        const { data: category, error } = await supabase.from('category').select('*')
        if (error) throw error;
        return category;
    },
    
    async getMeals(): Promise<IMeal[]> {
        const { data: meals, error } = await supabase.from('meals').select('*')
        console.log("data", meals);
        if (error) throw error;
        return meals;
    },

    async addMeal(meal: Omit<IMeal, 'id'>): Promise<void> {
        const { error } = await supabase.from('meals').insert(meal);
        if (error) throw error;
    },

    async updateMeal(id: number, meal: Partial<IMeal>): Promise<void> {
        const { error } = await supabase.from('meals').update(meal).eq('id', id);
        if (error) throw error;
    },

    async deleteMeal(id: number): Promise<void> {
        const { error } = await supabase.from('meals').delete().eq('id', id);
        if (error) throw error;
    },

    async getPredictions(): Promise<IPrediction[]> {
        const { data: predictions, error } = await supabase.from('predictions').select('*')
        if (error) throw error;
        return predictions;
    },

    async getMealHistory(): Promise<IMealHistory[]> {
        const { data, error } = await supabase
          .from('meal_history')
          .select(`
            *,
            meal:meals(*)
          `)
          .order('date', { ascending: false });
        
        if (error) throw error;
        return data;
      },
    
      async addMealHistory(
        mealId: number, 
        mealType: 'breakfast' | 'lunch' | 'dinner',
        quantity: number
      ): Promise<void> {
        const { data: meal } = await supabase
          .from('meals')
          .select('price')
          .eq('id', mealId)
          .single();
    
        const { error } = await supabase
          .from('meal_history')
          .insert({
            meal_id: mealId,
            meal_type: mealType,
            quantity: quantity,
            cost: meal?.price * quantity || 0
          });
    
        if (error) throw error;
      },

    async getNotifications(userId: string): Promise<INotification[]> {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    async markNotificationAsRead(notificationId: number): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);
        
        if (error) throw error;
    },

    async createNotification(notification: Omit<INotification, 'id' | 'created_at'>): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .insert(notification);
        
        if (error) throw error;
    },

    async deleteNotification(notificationId: number): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);
        
        if (error) throw error;
    },

    async submitFeedback(feedback: { category: string; subject: string; message: string }) {
        const { data, error } = await supabase
            .from('feedback')
            .insert([feedback])
        
        if (error) throw error
        return data
    },

    async getAnalytics({ startDate, endDate }: { startDate: string; endDate: string }) {
        const { data: orders, error } = await supabase
            .from('meal_history')
            .select(`
                *,
                meal:meals(*)
            `)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (error) throw error;

        const totalOrders = orders.length;
        const totalCost = orders.reduce((sum, order) => sum + order.cost, 0);
        const averageOrderValue = totalOrders > 0 ? totalCost / totalOrders : 0;

        const dailyOrders = orders.reduce((acc: any[], order) => {
            const date = order.date.split('T')[0];
            const existingDate = acc.find(d => d.date === date);
            if (existingDate) {
                existingDate.orders += 1;
            } else {
                acc.push({ date, orders: 1 });
            }
            return acc;
        }, []);

        return {
            totalOrders,
            averageOrderValue,
            dailyOrders,
            topItems: [],
            weeklyTrends: [],
            monthlyOverview: []
        };
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        })
        if (error) throw error
    },
}

export { dbService }