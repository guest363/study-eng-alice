import type { HTMLAttributes } from "react";
import { cn } from "../cn/cn";
import styles from "./panel.module.css";

export type PanelProps = HTMLAttributes<HTMLDivElement>;

export const Panel = ({ className, ...rest }: PanelProps) => (
  <div className={cn(styles.panel, className)} {...rest} />
);
