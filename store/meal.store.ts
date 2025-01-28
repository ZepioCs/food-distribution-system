import { action, makeAutoObservable, runInAction } from "mobx";
import { IMealHistory } from "@/models/default";
import type { RootStore } from "./root.store";
import { dbService } from "@/services/db.service";

export class MealStore {
  mealHistory: IMealHistory[] = [];
  isLoadingHistory: boolean = false;
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  @action
  async loadMealHistory() {
    try {
      this.isLoadingHistory = true;
      const history = await dbService.getMealHistory();
      console.log(history)
      runInAction(() => {
        this.mealHistory = history;
      });
    } catch (error) {
      console.error('Failed to load meal history:', error);
    } finally {
      runInAction(() => {
        this.isLoadingHistory = false;
      });
    }
  }

  @action
  async addMealToHistory(mealId: number, mealType: 'breakfast' | 'lunch' | 'dinner', quantity: number = 1) {
    try {
      await dbService.addMealHistory(mealId, mealType, quantity);
      await this.loadMealHistory();
    } catch (error) {
      console.error('Failed to add meal to history:', error);
      throw error;
    }
  }
}