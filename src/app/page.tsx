"use client";

import { DyRouterProvider, useDyRouter, ROUTES } from "@/lib/router";
import { SessionProvider } from "@/lib/session";
import { AppShell } from "@/components/app/shell";
import { OverviewView } from "@/components/app/overview";
import { EmployeesView } from "@/components/app/employees";
import { InboxView } from "@/components/app/inbox";
import {
  CustomersView,
  KnowledgeView,
  VoiceStudioView,
  LiveCallsView,
  AutomationsView,
  IntegrationsView,
  AnalyticsView,
  SettingsView,
} from "@/components/app/views";
import {
  HomePage,
  ProductIndexPage,
  ProductEmployeesPage,
  ProductVoicePage,
  ProductConversationsPage,
  ProductChannelsPage,
  ProductKnowledgePage,
  ProductAutomationsPage,
  ProductIntegrationsPage,
  SolutionsIndexPage,
  SolutionsIndividualsPage,
  SolutionsBusinessPage,
  SolutionsAgenciesPage,
} from "@/components/marketing/pages";
import {
  VoiceStudioPage,
  DevelopersPage,
  ResourcesIndexPage,
  GuidesPage,
  DocsPage,
  ChangelogPage,
  PricingPage,
  SecurityPage,
  AboutPage,
  ContactPage,
  LoginPage,
  SignupPage,
  LegalPage,
} from "@/components/marketing/pages2";
import { AdminConsole } from "@/components/admin/console";
import { MarketingPageShell } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

function MarketingRouter() {
  const { path } = useDyRouter();
  const [root, sub] = path;

  switch (root) {
    case undefined:
      return <HomePage />;
    case "product":
      switch (sub) {
        case undefined:
          return <ProductIndexPage />;
        case "ai-employees":
          return <ProductEmployeesPage />;
        case "voice":
          return <ProductVoicePage />;
        case "conversations":
          return <ProductConversationsPage />;
        case "channels":
          return <ProductChannelsPage />;
        case "knowledge":
          return <ProductKnowledgePage />;
        case "automations":
          return <ProductAutomationsPage />;
        case "integrations":
          return <ProductIntegrationsPage />;
        default:
          return <NotFoundPage />;
      }
    case "solutions":
      switch (sub) {
        case undefined:
          return <SolutionsIndexPage />;
        case "individuals":
          return <SolutionsIndividualsPage />;
        case "business":
          return <SolutionsBusinessPage />;
        case "agencies":
          return <SolutionsAgenciesPage />;
        default:
          return <NotFoundPage />;
      }
    case "voice-studio":
      return <VoiceStudioPage />;
    case "developers":
      return <DevelopersPage />;
    case "resources":
      switch (sub) {
        case undefined:
          return <ResourcesIndexPage />;
        case "guides":
          return <GuidesPage />;
        case "documentation":
          return <DocsPage />;
        case "changelog":
          return <ChangelogPage />;
        default:
          return <NotFoundPage />;
      }
    case "pricing":
      return <PricingPage />;
    case "security":
      return <SecurityPage />;
    case "about":
      return <AboutPage />;
    case "contact":
      return <ContactPage />;
    case "legal":
      switch (sub) {
        case "privacy":
          return <LegalPage kind="privacy" />;
        case "terms":
          return <LegalPage kind="terms" />;
        default:
          return <LegalPage kind="privacy" />;
      }
    case "login":
      return <LoginPage />;
    case "signup":
      return <SignupPage />;
    default:
      return <NotFoundPage />;
  }
}

function AppRouter() {
  const { path } = useDyRouter();
  const [, section] = path;

  switch (section) {
    case undefined:
      return <OverviewView />;
    case "employees":
      return <EmployeesView />;
    case "live-calls":
      return <LiveCallsView />;
    case "inbox":
      return <InboxView />;
    case "customers":
      return <CustomersView />;
    case "knowledge":
      return <KnowledgeView />;
    case "voice-studio":
      return <VoiceStudioView />;
    case "automations":
      return <AutomationsView />;
    case "integrations":
      return <IntegrationsView />;
    case "analytics":
      return <AnalyticsView />;
    case "settings":
      return <SettingsView />;
    default:
      return <OverviewView />;
  }
}

function NotFoundPage() {
  const { navigate } = useDyRouter();
  return (
    <MarketingPageShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-32 text-center">
        <FileQuestion className="mx-auto h-10 w-10 text-[#4A90E2]" />
        <h1 className="mt-6 font-display text-4xl tracking-tight">Page not found</h1>
        <p className="mt-3 text-sm text-neutral-400 max-w-sm mx-auto">
          This page does not exist. The link may be outdated, or the page moved.
        </p>
        <Button
          className="mt-8 bg-[#4A90E2] hover:bg-[#2E7CDE] text-white rounded-[2px]"
          onClick={() => navigate(ROUTES.home)}
        >
          Back to home
        </Button>
      </div>
    </MarketingPageShell>
  );
}

function Root() {
  const { path } = useDyRouter();
  const root = path[0];
  if (root === "admin") {
    return <AdminConsole />;
  }
  if (root === "app") {
    return (
      <AppShell>
        <AppRouter />
      </AppShell>
    );
  }
  if (root === "login" || root === "signup") {
    // auth pages render their own full-screen shell
    return <MarketingRouter />;
  }
  return <MarketingRouter />;
}

export default function Page() {
  return (
    <SessionProvider>
      <DyRouterProvider>
        <Root />
      </DyRouterProvider>
    </SessionProvider>
  );
}
