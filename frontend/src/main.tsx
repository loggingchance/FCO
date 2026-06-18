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
import type { Page } from "./types";
import "./styles.css";

function App() {
  const [page, setPage] = useState<Page>("home");
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
