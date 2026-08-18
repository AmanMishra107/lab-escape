import { createFileRoute } from "@tanstack/react-router";
import { LabOrchestrator } from "../components/lab/LabOrchestrator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lab Escape — The College Lab Boredom Simulator" },
      {
        name: "description",
        content:
          "Trapped in a 4-hour college computer lab. Explore the room, boot the ancient PC, play 10 mini-games, unlock achievements and hunt easter eggs until the bell rings.",
      },
      { property: "og:title", content: "Lab Escape — The College Lab Boredom Simulator" },
      {
        property: "og:description",
        content: "Four hours. One dusty lab PC. Ten mini-games, 31 achievements and 30 hidden secrets to survive it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <LabOrchestrator />;
}
