import React, { useState } from "react";
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
import { Workbench } from "./pages/Workbench";
import type { Page } from "./types";
import "./styles.css";

function App() {
  const [page, setPage] = useState<Page>("home");
  const enableWorkbench = import.meta.env.VITE_ENABLE_WORKBENCH !== "false";
  const pages: Record<Page, React.ReactNode> = {
    home: <Home setPage={setPage} />,
    explore: <Explore />,
    compare: <Compare />,
    reports: <Reports />,
    methodology: <Methodology />,
    history: <History />,
    about: <About />,
    limitations: <Limitations />,
    data: <DataSources />,
    glossary: <Glossary />,
    workbench: <Workbench />,
  };

  return (
    <>
      <Navigation page={page} setPage={setPage} enableWorkbench={enableWorkbench} />
      <main>{pages[page]}</main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
