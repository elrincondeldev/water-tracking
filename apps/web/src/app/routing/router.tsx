import { createBrowserRouter } from "react-router";
import { BottlePage } from "@/pages/bottle";
import { HistoryPage } from "@/pages/history";
import { ReviewPage } from "@/pages/review";
import { SettingsPage } from "@/pages/settings";
import { TodayPage } from "@/pages/today";
import { AppLayout } from "../layout/app-layout";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <TodayPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "bottle", element: <BottlePage /> },
      { path: "review", element: <ReviewPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
