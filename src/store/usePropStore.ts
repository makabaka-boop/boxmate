import { create } from 'zustand';
import type { AppState, AppActions, PropBox, FilterCriteria, BoxStatus, HandoverStatus, ViewMode, BatchHandoverData, HandoverRecord, AbnormalType } from '@/types';
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
      const newBox: PropBox = {
        ...boxData,
        handoverStatus: boxData.handoverStatus ?? 'pending',
        handoverPerson: boxData.handoverPerson ?? '',
        receiverPerson: boxData.receiverPerson ?? '',
        handoverTime: boxData.handoverTime ?? '',
        handoverNote: boxData.handoverNote ?? '',
        batchNumber: boxData.batchNumber ?? '',
        abnormalType: boxData.abnormalType ?? '',
        processStatus: boxData.processStatus ?? 'pending',
        processNote: boxData.processNote ?? '',
        handoverRecords: [],
        id: generateId(),
        createdAt: now,
        updatedAt: now,
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
        const newBoxes = state.boxes.map((box) =>
          box.id === id ? { ...box, ...updates, updatedAt: now } : box
        );
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
      const filteredBoxes = boxes
        .filter((b) => !filters.scene || b.scene === filters.scene)
        .filter((b) => !filters.responsiblePerson || b.responsiblePerson === filters.responsiblePerson)
        .filter((b) => !filters.status || b.status === filters.status)
        .filter((b) => !filters.riskLevel || b.riskLevel === filters.riskLevel)
        .filter((b) => !filters.handoverStatus || b.handoverStatus === filters.handoverStatus)
        .filter((b) => !filters.abnormalType || b.abnormalType === filters.abnormalType)
        .filter((b) => !filters.processStatus || b.processStatus === filters.processStatus)
        .filter((b) => !filters.batchNumber || b.batchNumber.includes(filters.batchNumber));
      const filteredIds = filteredBoxes.map((b) => b.id);
      const merged = Array.from(new Set([...selectedBoxIds, ...filteredIds]));
      set({ selectedBoxIds: merged });
    },

    clearSelection: () => {
      set({ selectedBoxIds: [] });
    },

    clearSelectionInFilter: () => {
      const { boxes, filters, selectedBoxIds } = get();
      const filteredBoxes = boxes
        .filter((b) => !filters.scene || b.scene === filters.scene)
        .filter((b) => !filters.responsiblePerson || b.responsiblePerson === filters.responsiblePerson)
        .filter((b) => !filters.status || b.status === filters.status)
        .filter((b) => !filters.riskLevel || b.riskLevel === filters.riskLevel)
        .filter((b) => !filters.handoverStatus || b.handoverStatus === filters.handoverStatus)
        .filter((b) => !filters.abnormalType || b.abnormalType === filters.abnormalType)
        .filter((b) => !filters.processStatus || b.processStatus === filters.processStatus)
        .filter((b) => !filters.batchNumber || b.batchNumber.includes(filters.batchNumber));
      const filteredIdSet = new Set(filteredBoxes.map((b) => b.id));
      set({ selectedBoxIds: selectedBoxIds.filter((id) => !filteredIdSet.has(id)) });
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
        const newBoxes = state.boxes.map((box) =>
          ids.includes(box.id)
            ? {
                ...box,
                handoverStatus,
                handoverTime: handoverStatus !== 'pending' ? now : '',
                updatedAt: now,
              }
            : box
        );
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
          
          const newRecord: HandoverRecord = {
            id: generateId(),
            boxId: box.id,
            batchNumber: data.batchNumber,
            handoverResult,
            handoverPerson: data.handoverPerson,
            receiverPerson: data.receiverPerson,
            abnormalType: isAbnormal ? data.abnormalType || '' : '',
            abnormalNote: isAbnormal ? data.handoverNote || '' : '',
            processStatus: isAbnormal ? data.processStatus || 'pending' : 'resolved',
            processNote: isAbnormal ? data.processNote || '' : '',
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
            handoverNote: data.handoverNote || box.handoverNote,
            batchNumber: data.batchNumber,
            abnormalType: isAbnormal ? data.abnormalType || '' : '',
            processStatus: isAbnormal ? data.processStatus || 'pending' : 'resolved',
            processNote: isAbnormal ? data.processNote || '' : '',
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
        const isAbnormal = record.handoverResult === 'abnormal';
        const safeRecord = {
          batchNumber: record.batchNumber ?? '',
          handoverResult: record.handoverResult ?? 'completed',
          handoverPerson: record.handoverPerson ?? '',
          receiverPerson: record.receiverPerson ?? '',
          abnormalType: (isAbnormal ? (record.abnormalType ?? '') : '') as AbnormalType | '',
          abnormalNote: isAbnormal ? (record.abnormalNote ?? '') : '',
          processStatus: isAbnormal ? (record.processStatus ?? 'pending') : 'resolved',
          processNote: isAbnormal ? (record.processNote ?? '') : '',
          createdBy: record.createdBy ?? record.handoverPerson ?? '',
        };
        const newRecord: HandoverRecord = {
          ...safeRecord,
          id: generateId(),
          boxId,
          handoverTime: now,
          processedAt: now,
        };

        const newBoxes: PropBox[] = state.boxes.map((box) => {
          if (box.id !== boxId) return box;

          return {
            ...box,
            handoverStatus: safeRecord.handoverResult,
            handoverPerson: safeRecord.handoverPerson,
            receiverPerson: safeRecord.receiverPerson,
            handoverTime: now,
            handoverNote: isAbnormal ? safeRecord.abnormalNote : (box.handoverNote || ''),
            batchNumber: safeRecord.batchNumber,
            abnormalType: safeRecord.abnormalType,
            processStatus: safeRecord.processStatus,
            processNote: isAbnormal ? safeRecord.processNote : box.processNote,
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
          
          return {
            ...box,
            handoverRecords: newRecords,
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
        const migrated: PropBox[] = stored.map((box) => {
          const migratedRecords: HandoverRecord[] = (box.handoverRecords ?? []).map((r) => ({
            id: r.id ?? generateId(),
            boxId: r.boxId ?? box.id,
            batchNumber: r.batchNumber ?? '',
            handoverResult: r.handoverResult ?? 'completed',
            handoverPerson: r.handoverPerson ?? '',
            receiverPerson: r.receiverPerson ?? '',
            abnormalType: (r.abnormalType ?? '') as HandoverRecord['abnormalType'],
            abnormalNote: r.abnormalNote ?? '',
            processStatus: r.processStatus ?? 'pending',
            processNote: r.processNote ?? '',
            handoverTime: r.handoverTime ?? new Date().toISOString(),
            processedAt: r.processedAt ?? r.handoverTime ?? new Date().toISOString(),
            createdBy: r.createdBy ?? r.handoverPerson ?? '',
          }));
          return {
            id: box.id ?? generateId(),
            boxNumber: box.boxNumber ?? '',
            contentSummary: box.contentSummary ?? '',
            scene: box.scene ?? '',
            fragileNote: box.fragileNote ?? '',
            status: box.status ?? 'pending_pack',
            supplementNote: box.supplementNote ?? '',
            responsiblePerson: box.responsiblePerson ?? '',
            riskLevel: box.riskLevel ?? 'low',
            needsReturn: box.needsReturn ?? false,
            returnNote: box.returnNote ?? '',
            isChecked: box.isChecked ?? false,
            handoverStatus: box.handoverStatus ?? 'pending',
            handoverPerson: box.handoverPerson ?? '',
            receiverPerson: box.receiverPerson ?? '',
            handoverTime: box.handoverTime ?? '',
            handoverNote: box.handoverNote ?? '',
            batchNumber: box.batchNumber ?? '',
            abnormalType: (box.abnormalType ?? '') as PropBox['abnormalType'],
            processStatus: box.processStatus ?? 'pending',
            processNote: box.processNote ?? '',
            handoverRecords: migratedRecords,
            createdAt: box.createdAt ?? new Date().toISOString(),
            updatedAt: box.updatedAt ?? box.createdAt ?? new Date().toISOString(),
          };
        });
        const alerts = runAllChecks(migrated);
        saveToLocalStorage(migrated);
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
