import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// globals отключены, поэтому авто-очистку RTL регистрируем сами — иначе экраны
// наслаиваются друг на друга между тестами.
afterEach(cleanup);
