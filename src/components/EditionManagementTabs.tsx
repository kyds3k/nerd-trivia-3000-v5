"use client";

import { useState, ReactNode } from "react";

const tabs = [
  "Landing",
  "Round 1",
  "Bonus 1",
  "Round 2",
  "Bonus 2",
  "Round 3",
  "Wager/Final",
];

interface EditionManagementTabsProps {
  landingContent: ReactNode;
  round1Content: ReactNode;
  bonus1Content: ReactNode;
  round2Content: ReactNode;
  bonus2Content: ReactNode;
  round3Content: ReactNode;
  wagerFinalContent: ReactNode;
}

export default function EditionManagementTabs({
  landingContent,
  round1Content,
  bonus1Content,
  round2Content,
  bonus2Content,
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
        {activeTab === "Bonus 1" && bonus1Content}
        {activeTab === "Round 2" && round2Content}
        {activeTab === "Bonus 2" && bonus2Content}
        {activeTab === "Round 3" && round3Content}
        {activeTab === "Wager/Final" && wagerFinalContent}
      </div>
    </div>
  );
}
