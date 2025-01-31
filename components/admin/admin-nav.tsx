'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  BrainCircuit,
  BarChart3,
  Settings,
  Users
} from "lucide-react";

interface AdminNavProps extends React.HTMLAttributes<HTMLElement> {}

export function AdminNav({ className, ...props }: AdminNavProps) {
  const pathname = usePathname();

  const items = [
    {
      href: "/admin",
      title: "Overview",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />
    },
    {
      href: "/admin/analytics",
      title: "Analytics",
      icon: <BarChart3 className="mr-2 h-4 w-4" />
    },
    {
      href: "/admin/ai-model",
      title: "AI Model",
      icon: <BrainCircuit className="mr-2 h-4 w-4" />
    },
    {
      href: "/admin/users",
      title: "Users",
      icon: <Users className="mr-2 h-4 w-4" />
    },
    {
      href: "/admin/settings",
      title: "Settings",
      icon: <Settings className="mr-2 h-4 w-4" />
    }
  ];

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname === item.href
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline",
            "justify-start"
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  );
} 