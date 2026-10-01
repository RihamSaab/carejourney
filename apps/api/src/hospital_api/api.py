from fastapi import APIRouter

from hospital_api.domains.appointments.router import (
    appointments_router,
    care_plan_appointments_router,
)
from hospital_api.domains.auth.router import router as auth_router
from hospital_api.domains.care_plans.router import router as care_plans_router
from hospital_api.domains.health.router import router as health_router
from hospital_api.domains.medications.router import (
    care_plan_medications_router,
    medication_events_router,
)
from hospital_api.domains.patients.router import router as patients_router
from hospital_api.domains.tasks.router import (
    care_plan_tasks_router,
    tasks_router,
)
from hospital_api.domains.users.router import router as users_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(patients_router)
api_router.include_router(care_plans_router)
api_router.include_router(care_plan_medications_router)
api_router.include_router(medication_events_router)
api_router.include_router(care_plan_tasks_router)
api_router.include_router(tasks_router)
api_router.include_router(care_plan_appointments_router)
api_router.include_router(appointments_router)
