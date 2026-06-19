import { create } from 'zustand';
import type { AppState, AppActions, PropBox, FilterCriteria, BoxStatus, HandoverStatus, ViewMode, BatchHandoverData, HandoverRecord, AbnormalType, ProcessStatus, RiskLevel } from '@/types';
import { generateId, saveToLocalStorage, loadFromLocalStorage } from '@/utils/storage';
import { mockBoxes } from '@/utils/mockData';
import { useAutoCheck } from '@/hooks/useAutoCheck';

const initialFilters: FilterCriteria = {
  scene: '',
  responsiblePerson: '',
  status: '',
  riskLevel: '',
  handoverStatus: '',
  abnormalType: '',
  processStatus: '',
  batchNumber: '',
};

const HANDOVER_SYNC_FIELDS = [
  'handoverStatus', 'handoverPerson', 'receiverPerson',
  'batchNumber', 'abnormalType', 'processStatus',
  'processNote', 'handoverNote', 'handoverTime',
] as const;

function createDefaultBox(): Omit<PropBox, 'id' | 'createdAt' | 'updatedAt' | 'handoverRecords'> {
  return {
    boxNumber: '',
    contentSummary: '',
    scene: '',
    fragileNote: '',
    status: 'pending_pack',
    supplementNote: '',
    responsiblePerson: '',
    riskLevel: 'low',
    needsReturn: false,
    returnNote: '',
    isChecked: false,
    handoverStatus: 'pending',
    handoverPerson: '',
    receiverPerson: '',
    handoverTime: '',
    handoverNote: '',
    batchNumber: '',
    abnormalType: '',
    processStatus: 'pending',
    processNote: '',
  };
}

function migrateBox(raw: any): PropBox {
  const now = new Date().toISOString();
  const base = createDefaultBox();
  return {
    ...base,
    ...raw,
    id: raw.id || generateId(),
    boxNumber: raw.boxNumber ?? '',
    contentSummary: raw.contentSummary ?? '',
    scene: raw.scene ?? '',
    fragileNote: raw.fragileNote ?? '',
    status: (raw.status as BoxStatus) ?? 'pending_pack',
    supplementNote: raw.supplementNote ?? '',
    responsiblePerson: raw.responsiblePerson ?? '',
    riskLevel: (raw.riskLevel as RiskLevel) ?? 'low',
    needsReturn: raw.needsReturn ?? false,
    returnNote: raw.returnNote ?? '',
    isChecked: raw.isChecked ?? false,
    handoverStatus: (raw.handoverStatus as HandoverStatus) ?? 'pending',
    handoverPerson: raw.handoverPerson ?? '',
    receiverPerson: raw.receiverPerson ?? '',
    handoverTime: raw.handoverTime ?? '',
    handoverNote: raw.handoverNote ?? '',
    batchNumber: raw.batchNumber ?? '',
    abnormalType: (raw.abnormalType as AbnormalType | '') ?? '',
    processStatus: (raw.processStatus as ProcessStatus) ?? 'pending',
    processNote: raw.processNote ?? '',
    handoverRecords: Array.isArray(raw.handoverRecords)
      ? raw.handoverRecords.map((r: any) => migrateHandoverRecord(r))
      : [],
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
}

function migrateHandoverRecord(raw: any): HandoverRecord {
  const now = new Date().toISOString();
  const handoverResult = (raw.handoverResult as HandoverStatus) ?? 'completed';
  const isAbnormal = handoverResult === 'abnormal';
  return {
    id: raw.id || generateId(),
    boxId: raw.boxId || '',
    batchNumber: raw.batchNumber ?? '',
    handoverResult,
    handoverPerson: raw.handoverPerson ?? '',
    receiverPerson: raw.receiverPerson ?? '',
    abnormalType: isAbnormal ? ((raw.abnormalType as AbnormalType) || '') : '',
    abnormalNote: isAbnormal ? (raw.abnormalNote ?? '') : '',
    processStatus: isAbnormal ? ((raw.processStatus as ProcessStatus) || 'pending') : 'resolved',
    processNote: isAbnormal ? (raw.processNote ?? '') : '',
    handoverTime: raw.handoverTime ?? now,
    processedAt: raw.processedAt ?? now,
    createdBy: raw.createdBy ?? raw.handoverPerson ?? '',
  };
}

export const usePropStore = create<AppState & AppActions>((set, get) => {
  const { runAllChecks } = useAutoCheck();

  return {
    boxes: [],
    selectedBoxIds: [],
    activeBoxId: null,
    filters: initialFilters,
    viewMode: 'normal',
    alerts: [],
    checklistFilterMode: 'all',

    addBox: (boxData) => {
      const now = new Date().toISOString();
      const defaults = createDefaultBox();
      const newBox: PropBox = {
        ...defaults,
        ...boxData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        handoverRecords: [],
        handoverStatus: boxData.handoverStatus ?? 'pending',
        handoverPerson: boxData.handoverPerson ?? '',
        receiverPerson: boxData.receiverPerson ?? '',
        handoverTime: boxData.handoverTime ?? '',
        handoverNote: boxData.handoverNote ?? '',
        batchNumber: boxData.batchNumber ?? '',
        abnormalType: boxData.abnormalType ?? '',
        processStatus: boxData.processStatus ?? 'pending',
        processNote: boxData.processNote ?? '',
      };
      set((state) => {
        const newBoxes = [...state.boxes, newBox];
        const newAlerts = runAllChecks(newBoxes);
        saveToLocalStorage(newBoxes);
        return { boxes: newBoxes, alerts: newAlerts, activeBoxId: newBox.id };
      });
    },

    updateBox: (id, updates) => {
      const now = new Date().toISOString();
      set((state) => {
        const newBoxes = state.boxes.map((box) => {
          if (box.id !== id) return box;

          const merged = { ...box, ...updates, updatedAt: now };
          const newHandoverStatus = merged.handoverStatus;

          if (newHandoverStatus === 'pending') {
            return merged;
          }

          const hasHandoverFieldChange = Object.keys(updates).some((k) =>
            (HANDOVER_SYNC_FIELDS as readonly string[]).includes(k)
          );

          if (hasHandoverFieldChange && merged.handoverRecords.length > 0) {
            const records = [...merged.handoverRecords];
            const lastIdx = records.length - 1;
            const last = records[lastIdx];
            const isAbnormal = newHandoverStatus === 'abnormal';
            const updatedLast: HandoverRecord = {
              ...last,
              handoverResult: newHandoverStatus,
              handoverPerson: merged.handoverPerson,
              receiverPerson: merged.receiverPerson,
              batchNumber: merged.batchNumber,
              abnormalType: isAbnormal ? (merged.abnormalType || '') : '',
              abnormalNote: merged.handoverNote || '',
              processStatus: isAbnormal ? (merged.processStatus || 'pending') : 'resolved',
              processNote: isAbnormal ? (merged.processNote || '') : last.processNote,
              processedAt: now,
            };
            records[lastIdx] = updatedLast;
            merged.handoverRecords = records;
          }

          return merged;
        });
        const newAlerts = runAllChecks(newBoxes);
        saveToLocalStorage(newBoxes);
        return { boxes: newBoxes, alerts: newAlerts };
      });
    },

    deleteBox: (id) => {
      set((state) => {
        const newBoxes = state.boxes.filter((box) => box.id !== id);
        const newAlerts = runAllChecks(newBoxes);
        saveToLocalStorage(newBoxes);
        return {
          boxes: newBoxes,
          alerts: newAlerts,
          selectedBoxIds: state.selectedBoxIds.filter((bid) => bid !== id),
          activeBoxId: state.activeBoxId === id ? null : state.activeBoxId,
        };
      });
    },

    toggleBoxSelection: (id) => {
      set((state) => ({
        selectedBoxIds: state.selectedBoxIds.includes(id)
          ? state.selectedBoxIds.filter((bid) => bid !== id)
          : [...state.selectedBoxIds, id],
      }));
    },

    selectAll: () => {
      const { boxes } = get();
      set({ selectedBoxIds: boxes.map((b) => b.id) });
    },

    clearSelection: () => {
      set({ selectedBoxIds: [] });
    },

    batchUpdateStatus: (ids, status) => {
      const now = new Date().toISOString();
      set((state) => {
        const newBoxes = state.boxes.map((box) =>
          ids.includes(box.id) ? { ...box, status, updatedAt: now } : box
        );
        const newAlerts = runAllChecks(newBoxes);
        saveToLocalStorage(newBoxes);
        return { boxes: newBoxes, alerts: newAlerts, selectedBoxIds: [] };
      });
    },

    batchUpdateHandover: (ids, handoverStatus) => {
      const now = new Date().toISOString();
      set((state) => {
        const newBoxes: PropBox[] = state.boxes.map((box) => {
          if (!ids.includes(box.id)) return box;
          if (handoverStatus === 'pending') {
            return {
              ...box,
              handoverStatus: 'pending' as const,
              handoverTime: '',
              handoverPerson: '',
              receiverPerson: '',
              batchNumber: '',
              abnormalType: '',
              processStatus: 'pending' as ProcessStatus,
              processNote: '',
              updatedAt: now,
            };
          }
          return {
            ...box,
            handoverStatus: handoverStatus as HandoverStatus,
            updatedAt: now,
          };
        });
        const newAlerts = runAllChecks(newBoxes);
        saveToLocalStorage(newBoxes);
        return { boxes: newBoxes, alerts: newAlerts, selectedBoxIds: [] };
      });
    },

    batchCompleteHandover: (ids, data) => {
      const now = new Date().toISOString();
      set((state) => {
        const handoverResult = data.handoverResult ?? 'completed';
        const isAbnormal = handoverResult === 'abnormal';
        const newBoxes: PropBox[] = state.boxes.map((box) => {
          if (!ids.includes(box.id)) return box;

          const recordProcessStatus: ProcessStatus = isAbnormal
            ? (data.processStatus || 'pending')
            : 'resolved';

          const newRecord: HandoverRecord = {
            id: generateId(),
            boxId: box.id,
            batchNumber: data.batchNumber,
            handoverResult,
            handoverPerson: data.handoverPerson,
            receiverPerson: data.receiverPerson,
            abnormalType: isAbnormal ? (data.abnormalType || '') : '',
            abnormalNote: data.handoverNote || '',
            processStatus: recordProcessStatus,
            processNote: isAbnormal ? (data.processNote || '') : '',
            handoverTime: now,
            processedAt: now,
            createdBy: data.handoverPerson,
          };

          return {
            ...box,
            handoverStatus: handoverResult,
            handoverPerson: data.handoverPerson,
            receiverPerson: data.receiverPerson,
            handoverTime: now,
            handoverNote: data.handoverNote || '',
            batchNumber: data.batchNumber,
            abnormalType: isAbnormal ? (data.abnormalType || '') : '',
            processStatus: recordProcessStatus,
            processNote: isAbnormal ? (data.processNote || '') : '',
            handoverRecords: [...box.handoverRecords, newRecord],
            updatedAt: now,
          };
        });
        const newAlerts = runAllChecks(newBoxes);
        saveToLocalStorage(newBoxes);
        return { boxes: newBoxes, alerts: newAlerts, selectedBoxIds: [] };
      });
    },

    addHandoverRecord: (boxId, record) => {
      const now = new Date().toISOString();
      set((state) => {
        const handoverResult = record.handoverResult;
        const isAbnormal = handoverResult === 'abnormal';
        const processStatus: ProcessStatus = isAbnormal
          ? (record.processStatus || 'pending')
          : 'resolved';

        const newRecord: HandoverRecord = {
          id: generateId(),
          boxId,
          batchNumber: record.batchNumber || '',
          handoverResult,
          handoverPerson: record.handoverPerson || '',
          receiverPerson: record.receiverPerson || '',
          abnormalType: isAbnormal ? ((record.abnormalType as AbnormalType) || '') : '',
          abnormalNote: record.abnormalNote || '',
          processStatus,
          processNote: isAbnormal ? (record.processNote || '') : '',
          handoverTime: now,
          processedAt: now,
          createdBy: record.createdBy || record.handoverPerson || '',
        };

        const newBoxes: PropBox[] = state.boxes.map((box) => {
          if (box.id !== boxId) return box;

          return {
            ...box,
            handoverStatus: handoverResult,
            handoverPerson: newRecord.handoverPerson,
            receiverPerson: newRecord.receiverPerson,
            handoverTime: now,
            handoverNote: newRecord.abnormalNote,
            batchNumber: newRecord.batchNumber,
            abnormalType: newRecord.abnormalType,
            processStatus: newRecord.processStatus,
            processNote: newRecord.processNote,
            handoverRecords: [...box.handoverRecords, newRecord],
            updatedAt: now,
          };
        });
        const newAlerts = runAllChecks(newBoxes);
        saveToLocalStorage(newBoxes);
        return { boxes: newBoxes, alerts: newAlerts };
      });
    },

    updateHandoverRecord: (boxId, recordId, updates) => {
      const now = new Date().toISOString();
      set((state) => {
        const newBoxes = state.boxes.map((box) => {
          if (box.id !== boxId) return box;

          const newRecords = box.handoverRecords.map((record) =>
            record.id === recordId
              ? { ...record, ...updates, processedAt: now }
              : record
          );

          const latestRecord = newRecords[newRecords.length - 1];
          const isAbnormal = latestRecord?.handoverResult === 'abnormal';

          return {
            ...box,
            handoverRecords: newRecords,
            handoverStatus: latestRecord?.handoverResult ?? box.handoverStatus,
            handoverPerson: latestRecord?.handoverPerson ?? box.handoverPerson,
            receiverPerson: latestRecord?.receiverPerson ?? box.receiverPerson,
            batchNumber: latestRecord?.batchNumber ?? box.batchNumber,
            handoverNote: latestRecord?.abnormalNote ?? box.handoverNote,
            abnormalType: isAbnormal ? (latestRecord?.abnormalType ?? '') : '',
            processStatus: isAbnormal ? (latestRecord?.processStatus ?? 'pending') : 'resolved',
            processNote: isAbnormal ? (latestRecord?.processNote ?? '') : '',
            handoverTime: latestRecord?.handoverTime ?? box.handoverTime,
            updatedAt: now,
          };
        });
        const newAlerts = runAllChecks(newBoxes);
        saveToLocalStorage(newBoxes);
        return { boxes: newBoxes, alerts: newAlerts };
      });
    },

    setChecklistFilterMode: (mode) => {
      set({ checklistFilterMode: mode });
    },

    setFilters: (newFilters) => {
      set((state) => ({
        filters: { ...state.filters, ...newFilters },
      }));
    },

    resetFilters: () => {
      set({ filters: initialFilters });
    },

    setViewMode: (mode: ViewMode) => {
      set({ viewMode: mode });
    },

    setActiveBox: (id) => {
      set({ activeBoxId: id });
    },

    runAutoCheck: () => {
      const { boxes } = get();
      const alerts = runAllChecks(boxes);
      set({ alerts });
      return alerts;
    },

    toggleCheck: (id) => {
      set((state) => {
        const newBoxes = state.boxes.map((box) =>
          box.id === id ? { ...box, isChecked: !box.isChecked } : box
        );
        const newAlerts = runAllChecks(newBoxes);
        saveToLocalStorage(newBoxes);
        return { boxes: newBoxes, alerts: newAlerts };
      });
    },

    loadFromStorage: () => {
      const stored = loadFromLocalStorage();
      if (stored && stored.length > 0) {
        const migrated = stored.map((b) => migrateBox(b));
        const alerts = runAllChecks(migrated);
        set({ boxes: migrated, alerts });
      } else {
        const migratedMock = mockBoxes.map((b) => migrateBox(b));
        const alerts = runAllChecks(migratedMock);
        set({ boxes: migratedMock, alerts });
        saveToLocalStorage(migratedMock);
      }
    },

    saveToStorage: () => {
      const { boxes } = get();
      saveToLocalStorage(boxes);
    },
  };
});
