import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Footer } from "./components/Footer";
import { Navigation } from "./components/Navigation";
import { About } from "./pages/About";
import { Compare } from "./pages/Compare";
import { DataSources } from "./pages/DataSources";
import { Explore } from "./pages/Explore";
import { Glossary } from "./pages/Glossary";
import { History } from "./pages/History";
import { Home } from "./pages/Home";
import { Limitations } from "./pages/Limitations";
import { Methodology } from "./pages/Methodology";
import { Reports } from "./pages/Reports";
import type { Page } from "./types";
import { trackUsage } from "./services/analytics";
import "./styles.css";

const pageMetadata: Record<Page, { title: string; description: string }> = {
  home: {
    title: "Forest Carbon Online (FCO) | FIA Carbon Estimates",
    description: "Explore official USDA Forest Service FIA forest carbon estimates for U.S. states and counties, with uncertainty, plot counts, comparisons, and reports.",
  },
  explore: {
    title: "Explore Forest Carbon Estimates | FCO",
    description: "Build FIA forest carbon estimates for U.S. states and counties using evaluation years, groupings, and forest filters.",
  },
  compare: {
    title: "Compare Forest Carbon by Place | FCO",
    description: "Compare official FIA forest carbon estimates between U.S. states or counties.",
  },
  reports: {
    title: "Forest Carbon Reports | FCO",
    description: "Review and export documented FIA forest carbon reports with uncertainty, sampling error, and contributing plot counts.",
  },
  methodology: {
    title: "Forest Carbon Methodology | FCO",
    description: "Learn how Forest Carbon Online requests, presents, converts, and documents USDA Forest Service FIA estimates.",
  },
  history: {
    title: "COLE and FCO History | Forest Carbon Online",
    description: "Read the history of COLE and the independent, unofficial Forest Carbon Online tribute app.",
  },
  about: {
    title: "About Forest Carbon Online",
    description: "About Forest Carbon Online, its creator, its COLE connection, and its independent and unofficial status.",
  },
  limitations: {
    title: "Data Limitations | Forest Carbon Online",
    description: "Understand appropriate uses, limitations, uncertainty, and interpretation of FIA forest carbon estimates.",
  },
  data: {
    title: "Forest Carbon Data Sources | FCO",
    description: "Review the USDA Forest Service FIA and EVALIDator data sources used by Forest Carbon Online.",
  },
  glossary: {
    title: "Forest Carbon Glossary | FCO",
    description: "Definitions for forest carbon pools, FIA estimates, uncertainty, sampling error, and related terms.",
  },
};

function App() {
  const [page, setPage] = useState<Page>("home");
  useEffect(() => {
    trackUsage("page_view", { page });
    const metadata = pageMetadata[page];
    document.title = metadata.title;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", metadata.description);
  }, [page]);
  const pages: Record<Page, React.ReactNode> = {
    home: <Home setPage={setPage} />,
    explore: <Explore />,
    compare: <Compare />,
    reports: <Reports setPage={setPage} />,
    methodology: <Methodology />,
    history: <History />,
    about: <About />,
    limitations: <Limitations />,
    data: <DataSources />,
    glossary: <Glossary />,
  };

  return (
    <>
      <Navigation page={page} setPage={setPage} />
      <main>{pages[page]}</main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
