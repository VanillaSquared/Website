import Footer from "@/components/Footer";
import TopBar from "@/components/Header";

export default function DefaultTemplatePage({ children, search = {} }) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <TopBar search={search} />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
