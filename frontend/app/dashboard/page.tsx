import { cookies } from "next/headers";

export default async function DashboardPage() {
    const cookieStore = await cookies();

  cookieStore.get("token");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <h1 className="text-3xl font-semibold mb-2">
            Dashboard
          </h1>

          <p className="text-gray-500 mb-6">
            Welcome to your dashboard
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="p-6 rounded-xl border bg-gray-50">
              <h2 className="font-medium text-lg">
                Projects
              </h2>
              <p className="text-gray-500 mt-2">
                Manage your projects
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-gray-50">
              <h2 className="font-medium text-lg">
                Settings
              </h2>
              <p className="text-gray-500 mt-2">
                Account settings
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-gray-50">
              <h2 className="font-medium text-lg">
                Usage
              </h2>
              <p className="text-gray-500 mt-2">
                View usage analytics
              </p>
            </div>

          </div>

          <form action="/api/auth/logout" method="POST" className="mt-8">
            <button
              className="bg-black text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
            >
              Logout
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}