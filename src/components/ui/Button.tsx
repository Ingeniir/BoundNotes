import { JSX, splitProps } from "solid-js";
import { clsx } from "clsx";

type Props = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button(props: Props) {
  const [local, rest] = splitProps(props, ["variant", "size", "class", "children"]);

  return (
    <button
      {...rest}
      class={clsx(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "bg-blue-600 text-white hover:bg-blue-700":
            local.variant === "primary",
          "hover:bg-gray-100 text-gray-700":
            local.variant === "ghost" || !local.variant,
          "text-red-600 hover:bg-red-50":
            local.variant === "danger",
          "text-sm px-3 py-1.5": local.size === "sm" || !local.size,
          "text-base px-4 py-2":  local.size === "md",
        },
        local.class
      )}
    >
      {local.children}
    </button>
  );
}