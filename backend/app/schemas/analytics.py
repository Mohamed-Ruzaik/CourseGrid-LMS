from pydantic import BaseModel


class AnalyticsSummary(BaseModel):
    total_users: int
    total_courses: int
    total_enrollments: int
    total_assignments: int
    total_submissions: int
    total_graded_submissions: int
    pending_assignments: int = 0
    completed_lessons: int = 0
    average_grade: float | None = None
