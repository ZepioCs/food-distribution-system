import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const mealCounts = {
  breakfast: 150,
  lunch: 200,
  dinner: 180,
}

const predictions = {
  breakfast: 160,
  lunch: 210,
  dinner: 190,
}

export default function KitchenView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Today's Meal Counts</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li>Breakfast: {mealCounts.breakfast}</li>
            <li>Lunch: {mealCounts.lunch}</li>
            <li>Dinner: {mealCounts.dinner}</li>
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tomorrow's Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li>Breakfast: {predictions.breakfast}</li>
            <li>Lunch: {predictions.lunch}</li>
            <li>Dinner: {predictions.dinner}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

