import type { HTMLAttributes } from "react";
import { cn } from "../cn/cn";
import styles from "./kicker.module.css";

export type KickerProps = HTMLAttributes<HTMLSpanElement>;

export const Kicker = ({ className, ...rest }: KickerProps) => (
  <span className={cn(styles.kicker, className)} {...rest} />
);
