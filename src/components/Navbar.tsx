import { Search } from "lucide-react";
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
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">Snipet</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link to="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Home
            </Link>
            <Link
              to="/new"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Create
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <form onSubmit={handleSubmit(onSearch)} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search snippets..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                {...register("search")}
              />
            </form>
          </div>
          <nav className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to={`/profile/${user.id}`}>Profile</Link>
                </Button>
                <Button variant="outline" onClick={signOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
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
