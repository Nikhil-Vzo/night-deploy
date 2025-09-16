import * as React from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  MapPin,
  Compass,
  CalendarClock,
  UserCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast"; // <-- THIS LINE IS NOW CORRECT

// Banner for unconfirmed users
function ConfirmEmailBanner({ user }: { user: User }) {
  const { toast } = useToast();
  const [sending, setSending] = React.useState(false);

  async function handleResendConfirmation() {
    const supabase = getSupabase();
    if (!supabase || !user.email) return;

    setSending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    });

    if (error) {
      toast({ title: "Error sending email", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Confirmation email sent!", description: "Please check your inbox." });
    }
    setSending(false);
  }

  return (
    <div className="bg-yellow-100 border-b border-yellow-300 text-yellow-800 text-sm">
      <div className="container py-2 flex items-center justify-center gap-2 text-center">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>Please confirm your email address.</span>
        <Button
          onClick={handleResendConfirmation}
          disabled={sending}
          variant="link"
          className="h-auto p-0 text-yellow-800 underline"
        >
          {sending ? "Sending..." : "Resend confirmation"}
        </Button>
      </div>
    </div>
  );
}

// Header component with all logic
function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = React.useState<User | null>(null);
  const [isEmailConfirmed, setIsEmailConfirmed] = React.useState(true);

  React.useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const updateUserState = (sessionUser: User | null) => {
        setUser(sessionUser);
        setIsEmailConfirmed(!!sessionUser?.email_confirmed_at);
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      updateUserState(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateUserState(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = getSupabase();
    if (!supabase) return;
    
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
  src="/logo.png"
  alt="Logo"
  className="w-14 h-14 rounded-md object-contain"
/>

            <span className="font-extrabold text-xl tracking-tight">Guidely</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <NavItem to="/quiz" label="Quiz" />
            <NavItem to="/career-map" label="Career Maps" />
            <NavItem to="/colleges" label="Colleges" />
            <NavItem to="/timeline" label="Timeline" />
            <NavItem to="/resources" label="Resources" />
            <NavItem to="/profile" label="Profile" />
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/profile" className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-foreground">{user.email}</Link>
                <Button onClick={handleLogout} variant="outline" className="rounded-full px-4">
                  Logout
                </Button>
              </>
            ) : (
              <>
                {pathname !== "/quiz" && (
                  <Button asChild className="hidden sm:inline-flex rounded-full px-5 font-semibold">
                    <Link to="/quiz">Take Quiz</Link>
                  </Button>
                )}
                <Button asChild variant="outline" className="rounded-full px-4">
                  <Link to="/onboarding">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="md:hidden border-t bg-white/90">
          <div className="container grid grid-cols-5 py-2 text-xs">
            <MobileNavItem to="/" icon={<Compass />} label="Home" />
            <MobileNavItem to="/quiz" icon={<GraduationCap />} label="Quiz" />
            <MobileNavItem to="/colleges" icon={<MapPin />} label="Colleges" />
            <MobileNavItem to="/timeline" icon={<CalendarClock />} label="Timeline" />
            <MobileNavItem to="/profile" icon={<UserCircle2 />} label="Me" />
          </div>
        </div>
      </header>
      {user && !isEmailConfirmed && <ConfirmEmailBanner user={user} />}
    </>
  );
}

// --- FULLY RESTORED HELPER COMPONENTS ---

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "text-muted-foreground transition-colors hover:text-foreground",
          isActive && "text-foreground font-semibold",
        )
      }
    >
      {label}
    </NavLink>
  );
}

function MobileNavItem({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"} // Ensure "Home" is only active on the exact path
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center gap-1 text-muted-foreground",
          isActive && "text-primary font-semibold",
        )
      }
    >
      <div className="[&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <span>{label}</span>
    </NavLink>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-white/60">
      <div className="container py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Guidely — from Code_Moses [Beta Version]
        
      </div>
    </footer>
  );
}

export default function Layout() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}