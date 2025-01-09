import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { buttonTap } from "@/lib/animations";

interface EnhancedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
}

const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ children, className, isLoading, loadingText = "Loading...", ...props }, ref) => {
    return (
      <motion.div
        variants={buttonTap}
        whileTap="tap"
        whileHover="hover"
      >
        <Button
          ref={ref}
          className={cn(
            "relative overflow-hidden transition-all duration-300",
            isLoading && "cursor-not-allowed",
            className
          )}
          disabled={isLoading}
          {...props}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              />
              <span>{loadingText}</span>
            </div>
          ) : (
            children
          )}
        </Button>
      </motion.div>
    );
  }
);

EnhancedButton.displayName = "EnhancedButton";

export { EnhancedButton };
