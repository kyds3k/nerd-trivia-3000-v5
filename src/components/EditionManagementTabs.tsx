"use client";

import { useState, ReactNode } from "react";

const tabs = [
  "Landing",
  "Round 1",
  "Impossible 1",
  "Round 2",
  "Impossible 2",
  "Round 3",
  "Wager/Final",
];

interface EditionManagementTabsProps {
  landingContent: ReactNode;
  round1Content: ReactNode;
  impossible1Content: ReactNode;
  round2Content: ReactNode;
  impossible2Content: ReactNode;
  round3Content: ReactNode;
  wagerFinalContent: ReactNode;
}

export default function EditionManagementTabs({
  landingContent,
  round1Content,
  impossible1Content,
  round2Content,
  impossible2Content,
  round3Content,
  wagerFinalContent,
}: EditionManagementTabsProps) {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);

  return (
    <div>
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === "Landing" && landingContent}
        {activeTab === "Round 1" && round1Content}
        {activeTab === "Impossible 1" && impossible1Content}
        {activeTab === "Round 2" && round2Content}
        {activeTab === "Impossible 2" && impossible2Content}
        {activeTab === "Round 3" && round3Content}
        {activeTab === "Wager/Final" && wagerFinalContent}
      </div>
    </div>
  );
}
