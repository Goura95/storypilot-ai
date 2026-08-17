const features = [
  {
    title: "User Story Generation",
    description:
      "Generate Azure DevOps-ready user stories instantly.",
  },
  {
    title: "Acceptance Criteria",
    description:
      "Automatically create structured acceptance criteria.",
  },
  {
    title: "Test Case Generator",
    description:
      "Generate complete QA test cases in seconds.",
  },
  {
    title: "Release Notes",
    description:
      "Automatically generate professional release notes.",
  },
];

export default function Features() {
  return (
    <section className="py-24 px-10">
      <h2 className="text-4xl font-bold text-center mb-16">
        Everything You Need
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl bg-gray-900 border border-gray-800 p-8 hover:border-blue-500 hover:scale-105 transition"
          >
            <h3 className="text-2xl font-bold mb-4">
              {feature.title}
            </h3>

            <p className="text-gray-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}