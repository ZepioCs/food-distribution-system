import { supabase } from "@/services/auth.service";
import { ICategory, IFeedback, IMeal, IMealHistory, INotification, IPrediction, IProfile, IRegisterRequest } from "@/models/default";

const dbService = {
    async getProfile(userId: string): Promise<IProfile> {
        const { data, error } = await supabase.from('users').select('*').eq('user_id', userId).single();
        if (error) throw error;
        return data;
    },

    async updateProfile(userId: string, profile: Partial<IProfile>): Promise<void> {
        const { data: currentProfile, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (fetchError) throw fetchError;

        const updatedProfile = {
            ...currentProfile,
            ...profile,
            user_id: userId,
        };

        const { error } = await supabase
            .from('users')
            .upsert(updatedProfile)
            .eq('user_id', userId);

        if (error) {
            throw error;
        }
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

    async getAllNotifications(): Promise<INotification[]> {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
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

    async getFeedback(): Promise<IFeedback[]> {
        const { data, error } = await supabase.from('feedback').select('*')
        if (error) throw error;
        return data;
    },

    async submitFeedback(feedback: { category: string; subject: string; message: string }) {
        const { data, error } = await supabase
            .from('feedback')
            .insert([feedback])
        
        if (error) throw error
        return data
    },

    async getAnalytics({ startDate, endDate, useTimeRange = true }: { startDate: string; endDate: string, useTimeRange?: boolean }) {
        const { data, error } = await supabase
            .from('meal_history')
            .select(`
                *,
                meal:meals(*)
            `)
            .order('date', { ascending: false });

        if (error) throw error;

        let filteredData;
        if (useTimeRange) {
            filteredData = data.filter((order: IMealHistory) => {
                const orderDate = new Date(order.date);
                return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
            });
        } else {
            filteredData = data;
        }

        const totalOrders = filteredData.length;
        const totalCost = filteredData.reduce((sum: number, order: IMealHistory) => {
            return sum + (order.cost || 0)
        }, 0);

        const averageOrderValue = totalOrders > 0 ? totalCost / totalOrders : 0;

        const dailyOrders = filteredData.reduce((acc: any[], order: IMealHistory) => {
            const date = order.date.split('T')[0];
            const existingDate = acc.find(d => d.date === date);
            if (existingDate) {
                existingDate.orders += 1;
                existingDate.value += order.cost || 0;
            } else {
                acc.push({ 
                    date, 
                    orders: 1,
                    value: order.cost || 0
                });
            }
            return acc;
        }, []);

        // Calculate top items
        const itemCounts = filteredData.reduce((acc: { [key: string]: { count: number, revenue: number } }, order: IMealHistory) => {
            const itemName = order.meal?.name || 'Unknown';
            if (!acc[itemName]) {
                acc[itemName] = { count: 0, revenue: 0 };
            }
            acc[itemName].count += order.quantity || 1;
            acc[itemName].revenue += order.cost || 0;
            return acc;
        }, {});

        const topItems = Object.entries(itemCounts)
            .map(([name, value]) => ({
                name,
                count: (value as { count: number }).count,
                revenue: (value as { revenue: number }).revenue
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            totalOrders,
            totalCost,
            averageOrderValue,
            dailyOrders,
            topItems,
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

    async getRegisterRequests(): Promise<IRegisterRequest[]> {
        const { data, error } = await supabase
            .from('registerRequests')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    },

    async acceptRegisterRequest(requestId: string): Promise<void> {
        // First get the request data
        const { data: request, error: fetchError } = await supabase
            .from('registerRequests')
            .select('*')
            .eq('id', requestId)
            .single()

        if (fetchError) throw fetchError

        if (request) {
            // Create the user profile
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    user_id: request.user_id,
                    email: request.email,
                    username: request.username,
                    role: request.role
                })

            if (profileError) throw profileError

            // Delete the request
            const { error: deleteError } = await supabase
                .from('registerRequests')
                .delete()
                .eq('id', requestId)

            if (deleteError) throw deleteError
        }
    },

    async createRegisterRequest(userData: { email: string, username: string, role: string, user_id: string }): Promise<void> {
        const { error } = await supabase
            .from('registerRequests')
            .insert(userData)

        if (error) throw error
    },

    async deleteRegisterRequest(requestId: string): Promise<void> {
        const { error } = await supabase
            .from('registerRequests')
            .delete()
            .eq('id', requestId)

        if (error) throw error
    },

    async getAllProfiles(): Promise<IProfile[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    },

    async getAllOrders(): Promise<IMealHistory[]> {
        const { data, error } = await supabase
            .from('meal_history')
            .select(`
                *,
                meal:meals(*)
            `)
            .order('date', { ascending: false })

        if (error) throw error
        return data || []
    },

    async getAllMenuItems(): Promise<IMeal[]> {
        const { data, error } = await supabase
            .from('meals')
            .select('*')

        if (error) throw error
        return data
    },
}

export { dbService }