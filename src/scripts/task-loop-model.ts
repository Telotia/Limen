export const loopSteps = [
  { label: 'Origin', title: 'One task, from Pharmacy A.', body: 'Pharmacy A releases T-01 for professional support. Its origin stays attached throughout the journey.' },
  { label: 'Pool', title: 'A shared pool. A traceable task.', body: 'T-01 joins the platform pool alongside tasks from other pharmacies. It remains linked to Pharmacy A.' },
  { label: 'Selected', title: 'A remote pharmacist selects T-01.', body: 'The highlighted pharmacist chooses this task from the pool. Selection happens before work begins.' },
  { label: 'Processing', title: 'Professional work, in progress.', body: 'The selected remote pharmacist works on T-01. The task and its originating pharmacy remain identifiable.' },
  { label: 'Return', title: 'Back to the same pharmacy.', body: 'The prepared work returns to Pharmacy A, ready for its review. Remote processing does not mark the task as reviewed.' },
  { label: 'Review', title: 'Pharmacy A reviews the work.', body: 'The returned task waits at the original pharmacy for review. Final confirmation stays with that pharmacy.' },
  { label: 'Reviewed', title: 'Reviewed. The loop is complete.', body: 'Only after Pharmacy A completes its review does T-01 receive its final reviewed state.' },
] as const;

export function loopState(progress: number) {
  const position = Math.max(0, Math.min(1, progress)) * loopSteps.length;
  const step = Math.min(loopSteps.length - 1, Math.floor(position));
  return { step, fraction: Math.min(1, position - step), task: 'T-01', origin: 'Pharmacy A', pharmacist: 2, reviewed: step === 6 };
}

export function ease(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
}
