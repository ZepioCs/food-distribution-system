import { action, makeAutoObservable, observable, runInAction } from "mobx";
import { EUserRole, ICategory, IMeal, IPrediction, IProfile } from "@/models/default";
import type { RootStore } from "./root.store";
import { dbService } from "@/services/db.service";
import { authService } from "@/services/auth.service";

export class AppStore {
  userRole: EUserRole | null = null;
  isLoggedIn: boolean = false;
  showAddMenu: boolean = false;
  showEditMenu: boolean = false;
  selectedMeal: IMeal | null = null;
  menuItems = observable<IMeal>([]);
  categories = observable<ICategory>([]);
  predictions = observable<IPrediction>([]);
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth();
  selectedWeek: number = Math.ceil(new Date().getDate() / 7);
  sessionCheckInterval: number | null = null;
  profile: IProfile | null = null;
  predictionData: {
    weekly: Array<{
      day: string;
      breakfast: number;
      lunch: number;
      dinner: number;
      date: string;
    }>;
    monthly: Array<{
      week: number;
      week_name: string;
      breakfast: number;
      lunch: number;
      dinner: number;
      date: string;
    }>;
  } = {
    weekly: [],
    monthly: [],
  };
  isLoadingMeals: boolean = false;
  isLoadingPredictions: boolean = false;
  rootStore: RootStore;
  availableYears: number[] = [];
  availableMonths: number[] = [];
  availableWeeks: number[] = [];

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  @action
  async initializeSession() {
    try {
      const session = await authService.getSession();
      if (session?.user) {
        const profile = await dbService.getProfile(session.user.id);
        runInAction(() => {
          this.profile = profile;
          this.userRole = profile.role as EUserRole;
          this.isLoggedIn = true;
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize session:', error);
      return false;
    }
  }

  @action
  initialize() {
    if (!this.sessionCheckInterval) {
      void this.initializeSession();
      this.initializeSessionCheck();
    }
  }

  @action
  cleanup() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  private initializeSessionCheck() {
    if (typeof window !== 'undefined') {
      this.cleanup();
      
      void this.checkSession();
      
      this.sessionCheckInterval = window.setInterval(() => {
        void this.checkSession();
      }, 5 * 60 * 1000);
    }
  }

  private async checkSession() {
    try {
      const isValid = await authService.refreshSession();
      if (!isValid) {
        this.logout();
      }
    } catch (error) {
      console.error('Session check failed:', error);
    }
  }

  @action
  setSelectedYear(year: number) {
    this.selectedYear = year;
    void this.loadPredictions();
  }

  @action
  setSelectedMonth(month: number) {
    this.selectedMonth = month;
    void this.loadPredictions();
  }

  @action
  setSelectedWeek(week: number) {
    this.selectedWeek = week;
    void this.loadPredictions();
  }

  @action
  public async loadPredictions() {
    try {
      this.isLoadingPredictions = true;
      const predictions = await dbService.getPredictions();
      
      const availableDates = predictions.map(p => new Date(p.date));
      const availableYears = [...new Set(availableDates.map(d => d.getFullYear()))];
      const availableMonths = [...new Set(availableDates
        .filter(d => d.getFullYear() === this.selectedYear)
        .map(d => d.getMonth()))];
      const availableWeeks = [...new Set(availableDates
        .filter(d => d.getFullYear() === this.selectedYear && d.getMonth() === this.selectedMonth)
        .map(d => Math.ceil(d.getDate() / 7)))];

      runInAction(() => {
        this.availableYears = availableYears;
        this.availableMonths = availableMonths;
        this.availableWeeks = availableWeeks;
      });

      const filteredPredictions = predictions.filter(prediction => {
        const date = new Date(prediction.date);
        return date.getFullYear() === this.selectedYear && date.getMonth() === this.selectedMonth;
      });

      const weeklyPredictions = filteredPredictions.filter(prediction => {
        const date = new Date(prediction.date);
        return Math.ceil(date.getDate() / 7) === this.selectedWeek;
      });

      const weeklyData = weeklyPredictions.map(prediction => {
        const date = new Date(prediction.date);
        return {
          day: date.toLocaleDateString('de-DE', { weekday: 'long' }),
          breakfast: prediction.breakfast,
          lunch: prediction.lunch,
          dinner: prediction.dinner,
          date: String(prediction.date),
        };
      });

      const weeklyGroups = filteredPredictions.reduce((groups, prediction) => {
        const date = new Date(prediction.date);
        const weekNum = Math.ceil(date.getDate() / 7);
        
        if (!groups[weekNum]) {
          groups[weekNum] = {
            count: 0,
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            date: String(prediction.date),
            startDate: new Date(date.getFullYear(), date.getMonth(), (weekNum - 1) * 7 + 1),
            endDate: new Date(date.getFullYear(), date.getMonth(), weekNum * 7),
          };
        }
        
        groups[weekNum].count++;
        groups[weekNum].breakfast += prediction.breakfast;
        groups[weekNum].lunch += prediction.lunch;
        groups[weekNum].dinner += prediction.dinner;
        
        return groups;
      }, {} as Record<number, { 
        count: number; 
        breakfast: number; 
        lunch: number; 
        dinner: number; 
        date: string;
        startDate: Date;
        endDate: Date;
      }>);

      const monthlyData = Object.entries(weeklyGroups).map(([week, data]) => ({
        week: parseInt(week),
        week_name: `${data.startDate.toLocaleDateString('de-DE', { 
          month: 'long',
          year: 'numeric',
          day: 'numeric'
        })} - ${data.endDate.toLocaleDateString('de-DE', { day: 'numeric' })}`,
        breakfast: Math.round(data.breakfast / data.count),
        lunch: Math.round(data.lunch / data.count),
        dinner: Math.round(data.dinner / data.count),
        date: data.date,
      }));

      runInAction(() => {
        this.predictionData.weekly = weeklyData;
        this.predictionData.monthly = monthlyData;
        this.predictions.replace(predictions);
      });
    } catch (error) {
      console.error('Failed to load predictions:', error);
    } finally {
      runInAction(() => {
        this.isLoadingPredictions = false;
      });
    }
  }

  @action
  public async loadMeals() {
    try {
      this.isLoadingMeals = true;
      const meals = await dbService.getMeals();
      const categories = await dbService.getCategories();

      if (categories) {
        meals.map((meal) => {
          meal.category = categories.find(category => category.id === meal.type)?.name;
        });
      }
      runInAction(() => {
        this.menuItems.replace(meals);
        this.categories.replace(categories);
      });
    } catch (error) {
      console.error('Failed to load meals:', error);
    } finally {
      runInAction(() => {
        this.isLoadingMeals = false;
      });
    }
  }

  @action
  addMenuMeal = async (mealData: Omit<IMeal, 'id'>) => {
    try {
      await dbService.addMeal(mealData);
      await this.loadMeals();
    } catch (error) {
      console.error('Failed to add meal:', error);
    }
  }

  @action
  updateMenuMeal = async (id: number, mealData: Partial<IMeal>) => {
    try {
      await dbService.updateMeal(id, mealData);
      await this.loadMeals();
    } catch (error) {
      console.error('Failed to update meal:', error);
    }
  }

  @action
  deleteMenuMeal = async (id: number) => {
    try {
      await dbService.deleteMeal(id);
      await this.loadMeals();
    } catch (error) {
      console.error('Failed to delete meal:', error);
    }
  }

  @action
  public toggleAddMenu() {
    this.showAddMenu = !this.showAddMenu;
  }

  @action
  public toggleEditMenu() {
    this.showEditMenu = !this.showEditMenu;
  }

  @action
  public setSelectedMeal(meal: IMeal | null) {
    this.selectedMeal = meal;
  }

  @action
  public async login(role: EUserRole) {
    this.userRole = role;
    this.isLoggedIn = true;
    this.initialize();
  }

  @action
  public async logout() {
    this.cleanup();
    await authService.logout();
    this.userRole = null;
    this.isLoggedIn = false;
  }
}