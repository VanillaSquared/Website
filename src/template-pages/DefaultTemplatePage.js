import Button from "@/components/Button";
import Footer from "@/components/Footer";
import TopBar from "@/components/Header";

const defaultBarItems = [
  "Combat overhaul",
  "Minecraft 1.21.4",
  <Button key="about" href="/about" size="sm" variant="secondary">
    About
  </Button>,
  <Button key="guide" href="/guide" size="sm" variant="secondary">
    Guide
  </Button>,
  <Button key="download" href="https://modrinth.com/mod/vsq" size="sm" external>
    Download
  </Button>,
];

export default function DefaultTemplatePage({ children, barItems = defaultBarItems }) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <TopBar items={barItems} />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
