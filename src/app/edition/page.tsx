"use client";

import EditionManagementTabs from "@/components/EditionManagementTabs";

export default function EditionsPage() {
  return (
    <div>
      <h1>Manage Editions</h1>
      <EditionManagementTabs
        landingContent={<div>Landing Content Placeholder</div>}
        round1Content={<div>Round 1 Content Placeholder</div>}
        impossible1Content={<div>Impossible 1 Content Placeholder</div>}
        round2Content={<div>Round 2 Content Placeholder</div>}
        impossible2Content={<div>Impossible 2 Content Placeholder</div>}
        round3Content={<div>Round 3 Content Placeholder</div>}
        wagerFinalContent={<div>Wager/Final Content Placeholder</div>}
      />
    </div>
  );
}