import { createFileRoute } from "@tanstack/react-router";
import { CommandCenter } from "@/components/flood/command-center";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <CommandCenter />;
}
