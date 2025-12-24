export default function Home() {
  // We'll eventually get these from a database
  const habits = [
    { id: 1, name: "Drink 2L Water", completed: false },
    { id: 2, name: "Read for 20 mins", completed: true },
    { id: 3, name: "Exercise", completed: false },
  ];

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">didido</h1>
      
      <div className="space-y-4">
        {habits.map((habit) => (
          <div 
            key={habit.id} 
            className="flex items-center justify-between p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-lg font-medium">{habit.name}</span>
            <input 
              type="checkbox" 
              checked={habit.completed}
              className="w-6 h-6 accent-blue-600"
              readOnly
            />
          </div>
        ))}
      </div>

      <button className="mt-8 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
        + Add New Activity
      </button>
    </main>
  );
}