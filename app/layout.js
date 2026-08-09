import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

import { ComplaintProvider } from "@/context/ComplaintContext";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "RaiseIt",
  description: "Complaint Management System",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen bg-background antialiased")}>
        <AuthProvider>
          <ComplaintProvider>
            {children}
          </ComplaintProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
