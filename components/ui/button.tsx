import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    // Basic button styles
    let variantClasses = "";
    let sizeClasses = "";

    // Handle variants
    switch (variant) {
      case "default":
        variantClasses = "bg-black text-white hover:bg-gray-800";
        break;
      case "destructive":
        variantClasses = "bg-red-600 text-white hover:bg-red-700";
        break;
      case "outline":
        variantClasses = "bg-transparent border border-gray-300 hover:bg-gray-100";
        break;
      case "secondary":
        variantClasses = "bg-gray-200 text-gray-900 hover:bg-gray-300";
        break;
      case "ghost":
        variantClasses = "bg-transparent hover:bg-gray-100";
        break;
      case "link":
        variantClasses = "bg-transparent underline-offset-4 hover:underline";
        break;
    }

    // Handle sizes
    switch (size) {
      case "default":
        sizeClasses = "h-10 px-4 py-2";
        break;
      case "sm":
        sizeClasses = "h-9 rounded-md px-3";
        break;
      case "lg":
        sizeClasses = "h-11 rounded-md px-8";
        break;
      case "icon":
        sizeClasses = "h-10 w-10";
        break;
    }

    return (
      <button
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantClasses} ${sizeClasses} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button }; 