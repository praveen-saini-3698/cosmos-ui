import type { Metadata } from "next"
import { CosmosProvider } from "@/lib/cosmos-context"
import { ThemeProvider } from "@/lib/theme-context"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "Cosmos UI - Azure Cosmos DB Explorer",
  description: "A modern UI for managing Azure Cosmos DB",
}

// Script to set theme before hydration to prevent flash
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('cosmos_theme');
      var root = document.documentElement;
      if (theme === 'light') {
        root.className = 'light';
      } else {
        root.className = 'dark';
      }
    } catch (e) {
      document.documentElement.className = 'dark';
    }
  })();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <CosmosProvider>
        {children}
            <Toaster position="top-right" />
          </CosmosProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
