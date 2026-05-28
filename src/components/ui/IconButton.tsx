import { JSX, splitProps } from "solid-js";
import { clsx } from "clsx";

type Props = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string; // pour l'accessibilité
  active?: boolean;
};

export function IconButton(props: Props) {
  const [local, rest] = splitProps(props, ["label", "active", "class", "children"]);

  return (
    <button
      {...rest}
      title={local.label}
      aria-label={local.label}
      class={clsx(
        "p-1.5 rounded-md transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        local.active
          ? "bg-gray-200 text-gray-900"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
        local.class
      )}
    >
      {local.children}
    </button>
  );
}