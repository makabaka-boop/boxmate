import type { PropBox, Alert } from '@/types';
import { generateId } from '@/utils/storage';

const HIGH_RISK_THRESHOLD = 3;
const LOAD_IMBALANCE_THRESHOLD = 0.5;

export const useAutoCheck = () => {
  const checkDuplicateBoxNumbers = (boxes: PropBox[]): Alert | null => {
    const boxNumberMap = new Map<string, string[]>();
    boxes.forEach((box) => {
      const existing = boxNumberMap.get(box.boxNumber) || [];
      boxNumberMap.set(box.boxNumber, [...existing, box.id]);
    });
    const duplicates: string[] = [];
    boxNumberMap.forEach((ids, number) => {
      if (ids.length > 1) {
        duplicates.push(...ids);
      }
    });
    if (duplicates.length > 0) {
      const dupNumbers = Array.from(boxNumberMap.entries())
        .filter(([, ids]) => ids.length > 1)
        .map(([num]) => num)
        .join('、');
      return {
        id: generateId(),
        type: 'duplicate_box',
        severity: 'error',
        message: `检测到箱号重复：${dupNumbers}`,
        affectedBoxIds: duplicates,
      };
    }
    return null;
  };

  const checkMissingReturnNotes = (boxes: PropBox[]): Alert | null => {
    const missing = boxes.filter(
      (box) => box.needsReturn && box.returnNote.trim() === ''
    );
    if (missing.length > 0) {
      return {
        id: generateId(),
        type: 'missing_return_note',
        severity: 'warning',
        message: `${missing.length} 个需返场的箱子缺少返场备注`,
        affectedBoxIds: missing.map((b) => b.id),
      };
    }
    return null;
  };

  const checkHighRiskExcess = (boxes: PropBox[]): Alert | null => {
    const sceneMap = new Map<string, PropBox[]>();
    boxes.forEach((box) => {
      if (box.riskLevel === 'high') {
        const existing = sceneMap.get(box.scene) || [];
        sceneMap.set(box.scene, [...existing, box]);
      }
    });
    const excessScenes: string[] = [];
    const affectedIds: string[] = [];
    sceneMap.forEach((highRiskBoxes, scene) => {
      if (highRiskBoxes.length > HIGH_RISK_THRESHOLD) {
        excessScenes.push(scene);
        affectedIds.push(...highRiskBoxes.map((b) => b.id));
      }
    });
    if (excessScenes.length > 0) {
      return {
        id: generateId(),
        type: 'high_risk_excess',
        severity: 'warning',
        message: `场次「${excessScenes.join('、')}」高风险箱超过 ${HIGH_RISK_THRESHOLD} 个，建议分散管理`,
        affectedBoxIds: affectedIds,
      };
    }
    return null;
  };

  const checkUnbalancedLoad = (boxes: PropBox[]): Alert | null => {
    const personMap = new Map<string, number>();
    boxes.forEach((box) => {
      const count = personMap.get(box.responsiblePerson) || 0;
      personMap.set(box.responsiblePerson, count + 1);
    });
    const counts = Array.from(personMap.values());
    if (counts.length < 2) return null;
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance =
      counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) /
      counts.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;
    if (coefficientOfVariation > LOAD_IMBALANCE_THRESHOLD) {
      const entries = Array.from(personMap.entries()).sort(
        (a, b) => b[1] - a[1]
      );
      const most = entries[0];
      const least = entries[entries.length - 1];
      const overloadedIds = boxes
        .filter((b) => b.responsiblePerson === most[0])
        .map((b) => b.id);
      return {
        id: generateId(),
        type: 'unbalanced_load',
        severity: 'warning',
        message: `责任人负载不均：${most[0]} 负责 ${most[1]} 箱，${least[0]} 仅负责 ${least[1]} 箱`,
        affectedBoxIds: overloadedIds,
      };
    }
    return null;
  };

  const checkCheckedNotHandedOver = (boxes: PropBox[]): Alert | null => {
    const notHanded = boxes.filter(
      (box) => box.needsReturn && box.isChecked && box.handoverStatus === 'pending'
    );
    if (notHanded.length > 0) {
      return {
        id: generateId(),
        type: 'checked_not_handed_over',
        severity: 'warning',
        message: `${notHanded.length} 个已勾选返场的箱子尚未完成交接确认`,
        affectedBoxIds: notHanded.map((b) => b.id),
      };
    }
    return null;
  };

  const checkAbnormalWithoutNote = (boxes: PropBox[]): Alert | null => {
    const noNote = boxes.filter(
      (box) => box.handoverStatus === 'abnormal' && box.handoverNote.trim() === ''
    );
    if (noNote.length > 0) {
      return {
        id: generateId(),
        type: 'abnormal_without_note',
        severity: 'error',
        message: `${noNote.length} 个异常交接的箱子未填写异常说明`,
        affectedBoxIds: noNote.map((b) => b.id),
      };
    }
    return null;
  };

  const runAllChecks = (boxes: PropBox[]): Alert[] => {
    const alerts: Alert[] = [];
    const duplicateAlert = checkDuplicateBoxNumbers(boxes);
    if (duplicateAlert) alerts.push(duplicateAlert);
    const missingNoteAlert = checkMissingReturnNotes(boxes);
    if (missingNoteAlert) alerts.push(missingNoteAlert);
    const highRiskAlert = checkHighRiskExcess(boxes);
    if (highRiskAlert) alerts.push(highRiskAlert);
    const loadAlert = checkUnbalancedLoad(boxes);
    if (loadAlert) alerts.push(loadAlert);
    const checkedNotHandedAlert = checkCheckedNotHandedOver(boxes);
    if (checkedNotHandedAlert) alerts.push(checkedNotHandedAlert);
    const abnormalNoNoteAlert = checkAbnormalWithoutNote(boxes);
    if (abnormalNoNoteAlert) alerts.push(abnormalNoNoteAlert);
    return alerts;
  };

  return {
    runAllChecks,
    checkDuplicateBoxNumbers,
    checkMissingReturnNotes,
    checkHighRiskExcess,
    checkUnbalancedLoad,
    checkCheckedNotHandedOver,
    checkAbnormalWithoutNote,
  };
};
