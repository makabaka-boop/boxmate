import { useEffect, useState } from 'react';
import { Toolbar } from '@/components/Toolbar';
import { PropBoxTable } from '@/components/PropBoxTable';
import { DetailEditor } from '@/components/DetailEditor';
import { SummaryPanel } from '@/components/SummaryPanel';
import { ChecklistView } from '@/components/ChecklistView';
import { usePropStore } from '@/store/usePropStore';

function App() {
  const { viewMode, loadFromStorage, setActiveBox, setFilters, filters, resetFilters } = usePropStore();
  const [highlightedBoxIds, setHighlightedBoxIds] = useState<string[]>([]);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const handleAffectedBoxClick = (boxIds: string[]) => {
    resetFilters();
    setHighlightedBoxIds(boxIds);
    if (boxIds.length > 0) {
      setActiveBox(boxIds[0]);
    }
    setTimeout(() => setHighlightedBoxIds([]), 3000);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <Toolbar />

      {viewMode === 'checklist' ? (
        <div className="flex-1 overflow-hidden">
          <ChecklistView />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
          <div className="flex-[55] min-h-0">
            <PropBoxTable highlightedBoxIds={highlightedBoxIds} />
          </div>

          <div className="flex-[45] min-h-0 flex gap-4">
            <div className="flex-[6] min-w-0">
              <DetailEditor />
            </div>
            <div className="flex-[4] min-w-0">
              <SummaryPanel onAffectedBoxClick={handleAffectedBoxClick} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
