function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reactivity Helper</h1>
      </header>

      <main className="space-y-4">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900">Reactivity Tracking</h2>
          <p className="text-sm text-gray-500">Log reactive incidents</p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900">Separation Anxiety</h2>
          <p className="text-sm text-gray-500">Log departures</p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900">Medications</h2>
          <p className="text-sm text-gray-500">Log doses</p>
        </div>
      </main>
    </div>
  )
}

export default App
