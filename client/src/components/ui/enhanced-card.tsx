import { forwardRef, HTMLAttributes } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardFooter } from "./card";
import { cardHover } from "@/lib/animations";

interface EnhancedCardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const EnhancedCard = forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ className, children, interactive = true, header, footer, ...props }, ref) => {
    const CardWrapper = interactive ? motion.div : "div";
    const cardProps = interactive
      ? {
          initial: "rest",
          whileHover: "hover",
          variants: cardHover,
        }
      : {};

    return (
      <CardWrapper {...cardProps}>
        <Card
          ref={ref}
          className={cn(
            "transition-shadow duration-300",
            interactive && "hover:shadow-lg",
            className
          )}
          {...props}
        >
          {header && <CardHeader>{header}</CardHeader>}
          <CardContent>{children}</CardContent>
          {footer && <CardFooter>{footer}</CardFooter>}
        </Card>
      </CardWrapper>
    );
  }
);

EnhancedCard.displayName = "EnhancedCard";

export { EnhancedCard };
