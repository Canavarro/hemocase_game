import { BrandBackground } from "./components/BrandBackground";
import { HostPage } from "./pages/HostPage";
import { JoinPage } from "./pages/JoinPage";
import { PlayPage } from "./pages/PlayPage";
import { ScreenPage } from "./pages/ScreenPage";

function route() {
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments[0] === "screen" && segments[1]) return <ScreenPage code={segments[1].toUpperCase()} />;
  if (segments[0] === "join" && segments[1]) return <JoinPage code={segments[1].toUpperCase()} />;
  if (segments[0] === "play" && segments[1]) return <PlayPage code={segments[1].toUpperCase()} />;
  return <HostPage />;
}

export function App() {
  return (
    <>
      <BrandBackground />
      {route()}
    </>
  );
}
