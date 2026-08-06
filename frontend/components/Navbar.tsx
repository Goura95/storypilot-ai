export default function Navbar() {
  return (
    <nav className="w-full flex justify-between items-center px-8 py-5">
      <h1 className="text-2xl font-bold text-white">
        StoryPilot AI
      </h1>

      <button className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-white">
        Login
      </button>
    </nav>
  );
}