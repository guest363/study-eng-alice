import type { ButtonHTMLAttributes } from "react";
import { cn } from "../cn/cn";
import styles from "./button.module.css";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: "primary" | "ghost";
};

export const Button = ({ variant = "primary", className, type, ...rest }: ButtonProps) => (
  <button
    type={type ?? "button"}
    className={cn(styles.button, styles[variant], className)}
    {...rest}
  />
);
