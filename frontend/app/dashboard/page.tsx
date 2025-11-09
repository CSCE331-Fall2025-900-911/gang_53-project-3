export default function Dashboard() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to the Dashboard!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          You have successfully logged in with Google OAuth.
        </p>
        <a
          href="http://localhost:5000/auth/logout"
          className="mt-4 inline-block px-6 py-2 text-white bg-red-500 rounded hover:bg-red-600"
        >
          Logout
        </a>
      </div>
    </div>
  );
}