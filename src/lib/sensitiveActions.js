import { writeAuditLog } from '@/lib/auditLog';

export async function executeSensitiveAction({
  action,
  context,
  confirmationText,
  actor,
  onExecute
}) {
  const acknowledged = window.confirm(`Sicherheitsbestätigung: ${confirmationText}`);
  if (!acknowledged) {
    writeAuditLog({
      type: 'sensitive_action_cancelled',
      action,
      context,
      actor: actor?.email || actor?.id || 'unknown'
    });
    return false;
  }

  const reason = window.prompt('Bitte Grund für diese Aktion eingeben (Audit-Log):');
  if (!reason?.trim()) {
    writeAuditLog({
      type: 'sensitive_action_blocked',
      action,
      context,
      actor: actor?.email || actor?.id || 'unknown',
      reason: 'missing_reason'
    });
    return false;
  }

  try {
    await onExecute();
    writeAuditLog({
      type: 'sensitive_action_executed',
      action,
      context,
      actor: actor?.email || actor?.id || 'unknown',
      reason: reason.trim(),
      status: 'success'
    });
    return true;
  } catch (error) {
    writeAuditLog({
      type: 'sensitive_action_executed',
      action,
      context,
      actor: actor?.email || actor?.id || 'unknown',
      reason: reason.trim(),
      status: 'error',
      error: error?.message
    });
    throw error;
  }
}
