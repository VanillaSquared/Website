import Footer from "@/components/Footer";
import TopBar from "@/components/Header";

export default function DefaultTemplatePage({ children, header = {}, search = {} }) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <TopBar search={search} {...header} />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
