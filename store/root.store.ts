import { makeAutoObservable } from "mobx"
import { MealStore } from "./meal.store"
import { AppStore } from "./app.store"
import { SettingsStore } from "./settings.store"

export class RootStore {
  mealStore: MealStore
  appStore: AppStore
  settingsStore: SettingsStore

  constructor() {
    makeAutoObservable(this)
    this.appStore = new AppStore(this)
    this.mealStore = new MealStore(this)
    this.settingsStore = new SettingsStore(this)
  }
}

  