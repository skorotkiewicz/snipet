import { Plus, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<{ search: string }>();

  const onSearch = (data: { search: string }) => {
    if (data.search.trim()) {
      navigate(`/?search=${encodeURIComponent(data.search)}`);
    } else {
      navigate("/");
    }
  };

  return (
    <nav className="w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
      <div className="w-full max-w-[800px] mx-auto px-4 flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block text-lg text-primary">Snipet</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Button asChild size="sm" className="gap-2 shadow-none">
              <Link to="/new">
                <Plus className="h-4 w-4" /> Create
              </Link>
            </Button>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <form onSubmit={handleSubmit(onSearch)} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-background/50"
                {...register("search")}
              />
            </form>
          </div>
          <nav className="flex items-center gap-2">
            {user ? (
              <>
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
