import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export function Layout() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navbar />
      <main className="w-full max-w-[800px] mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
