type ButtonProps = {
  text: string;
  variant?: "primary" | "secondary";
};

export default function Button({
  text,
  variant = "primary",
}: ButtonProps) {
  const baseStyle =
    "px-6 py-3 rounded-xl font-semibold transition duration-300";

  const primaryStyle =
    "bg-blue-600 hover:bg-blue-700 text-white";

  const secondaryStyle =
    "border border-gray-700 hover:border-blue-500 text-white";

  return (
    <button
      className={`${baseStyle} ${
        variant === "primary"
          ? primaryStyle
          : secondaryStyle
      }`}
    >
      {text}
    </button>
  );
}