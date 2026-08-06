export default function Features() {
  const features = [
    "AI User Story Generation",
    "Acceptance Criteria",
    "Test Case Generation",
    "Release Notes",
  ];

  return (
    <section className="py-20 px-8">
      <h2 className="text-4xl font-bold text-center mb-12">
        Features
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {features.map((feature) => (
          <div
            key={feature}
            className="bg-gray-900 p-6 rounded-xl border border-gray-800"
          >
            <h3 className="text-xl font-semibold">
              {feature}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
}