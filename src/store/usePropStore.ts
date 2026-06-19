import { create } from 'zustand';
import type { AppState, AppActions, PropBox, FilterCriteria, BoxStatus, HandoverStatus, ViewMode, BatchHandoverData, HandoverRecord, AbnormalType, ProcessStatus } from '@/types';
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
  'handoverStatus', 'handoverPerson', 'receiverPerson', 'handoverTime',
  'batchNumber', 'abnormalType', 'processStatus', 'handoverNote', 'processNote'
] as const;

const getFilteredBoxes = (boxes: PropBox[], filters: FilterCriteria): PropBox[] => {
  return boxes
    .filter((b) => !filters.scene || b.scene === filters.scene)
    .filter((b) => !filters.responsiblePerson || b.responsiblePerson === filters.responsiblePerson)
    .filter((b) => !filters.status || b.status === filters.status)
    .filter((b) => !filters.riskLevel || b.riskLevel === filters.riskLevel)
    .filter((b) => !filters.handoverStatus || b.handoverStatus === filters.handoverStatus)
    .filter((b) => !filters.abnormalType || b.abnormalType === filters.abnormalType)
    .filter((b) => !filters.processStatus || b.processStatus === filters.processStatus)
    .filter((b) => !filters.batchNumber || b.batchNumber.includes(filters.batchNumber));
};

const migrateBox = (raw: Partial<PropBox>): PropBox => {
  const now = new Date().toISOString();
  return {
    id: raw.id || generateId(),
    boxNumber: raw.boxNumber ?? '',
    contentSummary: raw.contentSummary ?? '',
    scene: raw.scene ?? '',
    fragileNote: raw.fragileNote ?? '',
    status: raw.status ?? 'pending_pack',
    supplementNote: raw.supplementNote ?? '',
    responsiblePerson: raw.responsiblePerson ?? '',
    riskLevel: raw.riskLevel ?? 'low',
    needsReturn: raw.needsReturn ?? true,
    returnNote: raw.returnNote ?? '',
    isChecked: raw.isChecked ?? false,
    handoverStatus: raw.handoverStatus ?? 'pending',
    handoverPerson: raw.handoverPerson ?? '',
    receiverPerson: raw.receiverPerson ?? '',
    handoverTime: raw.handoverTime ?? '',
    handoverNote: raw.handoverNote ?? '',
    batchNumber: raw.batchNumber ?? '',
    abnormalType: raw.abnormalType ?? '',
    processStatus: raw.processStatus ?? 'pending',
    processNote: raw.processNote ?? '',
    handoverRecords: (raw.handoverRecords ?? []).map((r: Partial<HandoverRecord>) => ({
      id: r.id || generateId(),
      boxId: r.boxId || raw.id || '',
      batchNumber: r.batchNumber ?? '',
      handoverResult: r.handoverResult ?? 'completed',
      handoverPerson: r.handoverPerson ?? '',
      receiverPerson: r.receiverPerson ?? '',
      handoverNote: r.handoverNote ?? (r.handoverResult !== 'abnormal' ? (r.abnormalNote ?? '') : ''),
      abnormalType: r.abnormalType ?? '',
      abnormalNote: r.abnormalNote ?? '',
      processStatus: r.processStatus ?? (r.handoverResult === 'abnormal' ? 'pending' : 'resolved'),
      processNote: r.processNote ?? '',
      handoverTime: r.handoverTime ?? now,
      processedAt: r.processedAt ?? now,
      createdBy: r.createdBy ?? r.handoverPerson ?? '',
    })),
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
};

const syncLatestHandoverRecord = (box: PropBox, updates: Partial<PropBox>): PropBox => {
  if (!box.handoverRecords || box.handoverRecords.length === 0) return box;
  if (box.handoverStatus === 'pending') return box;

  const hasHandoverFieldChange = HANDOVER_SYNC_FIELDS.some(f => f in updates);
  if (!hasHandoverFieldChange) return box;

  const records = [...box.handoverRecords];
  const lastIdx = records.length - 1;
  const lastRecord = records[lastIdx];
  const currentStatus = (updates.handoverStatus as HandoverStatus) ?? box.handoverStatus ?? lastRecord.handoverResult;

  const syncedRecord: HandoverRecord = {
    ...lastRecord,
    batchNumber: updates.batchNumber ?? box.batchNumber ?? lastRecord.batchNumber,
    handoverResult: currentStatus,
    handoverPerson: updates.handoverPerson ?? box.handoverPerson ?? lastRecord.handoverPerson,
    receiverPerson: updates.receiverPerson ?? box.receiverPerson ?? lastRecord.receiverPerson,
    handoverNote: currentStatus !== 'abnormal' ? (updates.handoverNote ?? box.handoverNote ?? lastRecord.handoverNote) : lastRecord.handoverNote,
    abnormalType: currentStatus === 'abnormal' ? ((updates.abnormalType as AbnormalType | '') ?? box.abnormalType ?? lastRecord.abnormalType) : '',
    abnormalNote: currentStatus === 'abnormal' ? (updates.handoverNote ?? lastRecord.abnormalNote) : '',
    processStatus: currentStatus === 'abnormal' ? ((updates.processStatus as ProcessStatus) ?? box.processStatus ?? lastRecord.processStatus) : 'resolved',
    processNote: currentStatus === 'abnormal' ? (updates.processNote ?? box.processNote ?? lastRecord.processNote) : '',
    handoverTime: updates.handoverTime ?? lastRecord.handoverTime,
    processedAt: new Date().toISOString(),
  };

  records[lastIdx] = syncedRecord;
  return { ...box, handoverRecords: records };
};

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
      const newBox: PropBox = migrateBox({
        ...boxData,
        handoverStatus: 'pending',
        handoverRecords: [],
        createdAt: now,
        updatedAt: now,
      });
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
          let updated = { ...box, ...updates, updatedAt: now };
          updated = syncLatestHandoverRecord(updated, updates);
          return updated;
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
      const { boxes, filters, selectedBoxIds } = get();
      const filteredBoxes = getFilteredBoxes(boxes, filters);
      const filteredIds = new Set(filteredBoxes.map((b) => b.id));
      const otherSelected = selectedBoxIds.filter((id) => !filteredIds.has(id));
      const allFilteredSelected = filteredBoxes.every((b) => selectedBoxIds.includes(b.id));
      if (allFilteredSelected) {
        set({ selectedBoxIds: otherSelected });
      } else {
        set({ selectedBoxIds: [...new Set([...otherSelected, ...filteredBoxes.map((b) => b.id)])] });
      }
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
              updatedAt: now,
            };
          }
          return {
            ...box,
            handoverStatus: handoverStatus as HandoverStatus,
            handoverTime: box.handoverTime || now,
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

          const record: HandoverRecord = {
            id: generateId(),
            boxId: box.id,
            batchNumber: data.batchNumber || '',
            handoverResult,
            handoverPerson: data.handoverPerson || '',
            receiverPerson: data.receiverPerson || '',
            handoverNote: isAbnormal ? '' : (data.handoverNote || ''),
            abnormalType: isAbnormal ? (data.abnormalType || '') : '',
            abnormalNote: isAbnormal ? (data.handoverNote || '') : '',
            processStatus: isAbnormal ? (data.processStatus || 'pending') : 'resolved',
            processNote: isAbnormal ? (data.processNote || '') : '',
            handoverTime: now,
            processedAt: now,
            createdBy: data.handoverPerson || '',
          };

          return {
            ...box,
            handoverStatus: handoverResult,
            handoverPerson: data.handoverPerson || '',
            receiverPerson: data.receiverPerson || '',
            handoverTime: now,
            handoverNote: isAbnormal ? record.abnormalNote : record.handoverNote,
            batchNumber: data.batchNumber || box.batchNumber,
            abnormalType: record.abnormalType,
            processStatus: record.processStatus,
            processNote: record.processNote,
            handoverRecords: [...box.handoverRecords, record],
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
        const isAbnormal = record.handoverResult === 'abnormal';
        const newRecord: HandoverRecord = {
          id: generateId(),
          boxId,
          batchNumber: record.batchNumber || '',
          handoverResult: record.handoverResult || 'completed',
          handoverPerson: record.handoverPerson || '',
          receiverPerson: record.receiverPerson || '',
          handoverNote: isAbnormal ? '' : (record.handoverNote || record.abnormalNote || ''),
          abnormalType: isAbnormal ? (record.abnormalType || '') : '',
          abnormalNote: isAbnormal ? (record.abnormalNote || '') : '',
          processStatus: record.processStatus || (isAbnormal ? 'pending' : 'resolved'),
          processNote: isAbnormal ? (record.processNote || '') : '',
          handoverTime: now,
          processedAt: now,
          createdBy: record.createdBy || record.handoverPerson || '',
        };

        const newBoxes: PropBox[] = state.boxes.map((box) => {
          if (box.id !== boxId) return box;

          return {
            ...box,
            handoverStatus: newRecord.handoverResult,
            handoverPerson: newRecord.handoverPerson,
            receiverPerson: newRecord.receiverPerson,
            handoverTime: now,
            handoverNote: isAbnormal ? newRecord.abnormalNote : newRecord.handoverNote,
            batchNumber: newRecord.batchNumber || box.batchNumber,
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
          const isLatest = latestRecord && latestRecord.id === recordId;

          let updatedBox: PropBox = {
            ...box,
            handoverRecords: newRecords,
            updatedAt: now,
          };

          if (isLatest) {
            const resultStatus = updates.handoverResult ?? latestRecord.handoverResult;
            const isAbnormal = resultStatus === 'abnormal';
            updatedBox = {
              ...updatedBox,
              handoverStatus: resultStatus,
              handoverPerson: updates.handoverPerson ?? latestRecord.handoverPerson,
              receiverPerson: updates.receiverPerson ?? latestRecord.receiverPerson,
              batchNumber: updates.batchNumber ?? latestRecord.batchNumber,
              handoverNote: isAbnormal ? (updates.abnormalNote ?? latestRecord.abnormalNote) : (updates.handoverNote ?? latestRecord.handoverNote),
              abnormalType: isAbnormal ? (updates.abnormalType ?? latestRecord.abnormalType) : '',
              processStatus: isAbnormal ? (updates.processStatus ?? latestRecord.processStatus) : 'resolved',
              processNote: isAbnormal ? (updates.processNote ?? latestRecord.processNote) : '',
            };
          }

          return updatedBox;
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
        const migrated = stored.map((box) => migrateBox(box));
        const alerts = runAllChecks(migrated);
        set({ boxes: migrated, alerts });
      } else {
        const alerts = runAllChecks(mockBoxes);
        set({ boxes: mockBoxes, alerts });
        saveToLocalStorage(mockBoxes);
      }
    },

    saveToStorage: () => {
      const { boxes } = get();
      saveToLocalStorage(boxes);
    },
  };
});
