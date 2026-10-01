from hospital_api.core.audit.models import AuditLog
from hospital_api.core.audit.service import record_audit

__all__ = ["AuditLog", "record_audit"]
