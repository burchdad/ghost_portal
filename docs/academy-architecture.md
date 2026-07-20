# Ghost Academy Architecture

Ghost Academy lives inside Ghost Portal as the internal learning layer for role onboarding, SOPs, policies, knowledge checks, acknowledgements, notes, questions, and Founder review.

Phase 1 keeps the existing portal layout, auth, roles, and workflow modules. Academy data is stored in dedicated Prisma models: `LearningPath`, `LearningPathAssignment`, `Course`, `CourseModule`, `KnowledgeCheck`, `ModuleCompletion`, `PolicyAcknowledgement`, `EmployeeModuleNote`, `EmployeeQuestion`, `SOPArticle`, and `AcademyActivity`.

Legacy `/onboarding` redirects to `/academy` so existing habits keep working while training moves into Ghost Academy.
