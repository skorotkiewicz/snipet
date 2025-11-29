import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";

export function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
      <div className="w-full max-w-[800px] mx-auto px-4 flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block text-lg text-primary">Snipet</span>
          </Link>
          {/* <nav className="flex items-center space-x-6 text-sm font-medium">
            <Button asChild size="sm" className="gap-2 shadow-none">
              <Link to="/new">
                <Plus className="h-4 w-4" /> Create
              </Link>
            </Button>
          </nav> */}
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center gap-2">
            {user ? (
              <>
                <Button asChild size="sm" className="gap-2 shadow-none">
                  <Link to="/new">
                    <Plus className="h-4 w-4" /> Create
                  </Link>
                </Button>
                <Button variant="ghost" asChild size="sm">
                  <Link to={`/profile/${user.id}`}>Profile</Link>
                </Button>
                <Button variant="outline" onClick={signOut} size="sm">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild size="sm">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </nav>
  );
}
