
import { Project, Risk, Milestone, Report, LessonLearned, Task, ProjectStatus, CostStatus, RiskImpact, RiskProbability, MilestoneStatus, TaskStatus } from './types';

export const PROJECTS: Project[] = [
  { id: 'P001', name: 'Despliegue de Infraestructura Cloud', progress: 75, status: ProjectStatus.OnTrack, client: 'Ayesa', endDate: '2024-12-31', projectManager: 'Ana García', budget: 50000, spent: 37000, costStatus: CostStatus.OnBudget },
  { id: 'P002', name: 'Sistema de Gestión de Clientes (CRM)', progress: 40, status: ProjectStatus.AtRisk, client: 'Tech Solutions', endDate: '2025-03-15', projectManager: 'Carlos Pérez', budget: 80000, spent: 45000, costStatus: CostStatus.OverBudget },
  { id: 'P003', name: 'Consultoría Estratégica Digital', progress: 95, status: ProjectStatus.Completed, client: 'Innovate Corp', endDate: '2024-08-01', projectManager: 'Laura Martínez', budget: 30000, spent: 28000, costStatus: CostStatus.UnderBudget },
  { id: 'P004', name: 'Desarrollo de App Móvil', progress: 20, status: ProjectStatus.OffTrack, client: 'Startup X', endDate: '2025-06-30', projectManager: 'Carlos Pérez', budget: 120000, spent: 50000, costStatus: CostStatus.OverBudget },
  { id: 'P005', name: 'Auditoría de Seguridad IT', progress: 60, status: ProjectStatus.OnHold, client: 'Ayesa', endDate: '2024-11-20', projectManager: 'Ana García', budget: 25000, spent: 15000, costStatus: CostStatus.OnBudget },
];

export const PROJECTS_BASELINE: Omit<Project, 'progress' | 'status' | 'costStatus' | 'spent'>[] = [
    { id: 'P001', name: 'Despliegue de Infraestructura Cloud', client: 'Ayesa', endDate: '2024-12-20', projectManager: 'Ana García', budget: 48000 },
    { id: 'P002', name: 'Sistema de Gestión de Clientes (CRM)', client: 'Tech Solutions', endDate: '2025-03-01', projectManager: 'Carlos Pérez', budget: 75000 },
    { id: 'P004', name: 'Desarrollo de App Móvil', client: 'Startup X', endDate: '2025-05-30', projectManager: 'Carlos Pérez', budget: 100000 },
];

export const RISKS: Risk[] = [
  { id: 'R01', projectId: 'P002', name: 'Retraso en la definición de requisitos por parte del cliente', impact: RiskImpact.High, probability: RiskProbability.Medium, owner: 'Carlos Pérez', mitigationPlan: 'Agendar reuniones de trabajo intensivas con stakeholders clave.', status: 'Abierto', lastUpdated: '2024-07-20' },
  { id: 'R02', projectId: 'P004', name: 'Falta de recursos de desarrollo frontend', impact: RiskImpact.High, probability: RiskProbability.High, owner: 'Carlos Pérez', mitigationPlan: 'Contratación externa de un desarrollador o reasignación interna.', status: 'Monitoreando', lastUpdated: '2024-07-18' },
  { id: 'R03', projectId: 'P001', name: 'Posible incompatibilidad con sistema legado', impact: RiskImpact.Medium, probability: RiskProbability.Low, owner: 'Ana García', mitigationPlan: 'Realizar PoC (Prueba de Concepto) antes de la integración final.', status: 'Cerrado', lastUpdated: '2024-06-30' },
  { id: 'R04', projectId: 'P002', name: 'Baja adopción de la plataforma por usuarios finales', impact: RiskImpact.Medium, probability: RiskProbability.Medium, owner: 'Laura Martínez', mitigationPlan: 'Plan de capacitación y comunicación intensivo.', status: 'Abierto', lastUpdated: '2024-07-22'},
];

export const MILESTONES: Milestone[] = [
  { id: 'M01', projectId: 'P001', name: 'Fase 1: Aprovisionamiento de servidores', status: MilestoneStatus.Completed, dueDate: '2024-05-30' },
  { id: 'M02', projectId: 'P001', name: 'Fase 2: Configuración de red', status: MilestoneStatus.InProgress, dueDate: '2024-08-15' },
  { id: 'M03', projectId: 'P002', name: 'Kick-off y levantamiento de requisitos', status: MilestoneStatus.Delayed, dueDate: '2024-07-10' },
  { id: 'M04', projectId: 'P002', name: 'Entrega de Mockups y Prototipos', status: MilestoneStatus.Pending, dueDate: '2024-09-01' },
  { id: 'M05', projectId: 'P004', name: 'Definición de Arquitectura', status: MilestoneStatus.Delayed, dueDate: '2024-07-20' },
];

export const REPORTS: Report[] = [
    { id: 'REP01', projectId: 'P001', week: 'Semana 28', activitiesDone: 'Se completó la configuración de VPCs.', nextSteps: 'Iniciar configuración de bases de datos.', newRisks: 'Ninguno.', submittedBy: 'Ana García', date: '2024-07-19' },
    { id: 'REP02', projectId: 'P002', week: 'Semana 28', activitiesDone: 'Reuniones con cliente para definir alcance.', nextSteps: 'Documentar requisitos detallados.', newRisks: 'Se identificó el riesgo R01.', submittedBy: 'Carlos Pérez', date: '2024-07-20' },
];

export const LESSONS_LEARNED: LessonLearned[] = [
    { id: 'LL01', projectId: 'P003', category: 'Comunicación', description: 'La comunicación diaria (daily stand-ups) con el cliente fue clave para el éxito y la alineación constante.', votes: 15 },
    { id: 'LL02', projectId: 'P003', category: 'Planificación', description: 'Involucrar al equipo técnico desde las fases iniciales de estimación mejora la precisión de los plazos.', votes: 12 },
    { id: 'LL03', projectId: 'P003', category: 'Gestión de Stakeholders', description: 'Un mapa de stakeholders claro evitó conflictos de interés y aseguró el apoyo necesario.', votes: 8 },
];

export const TASKS: Task[] = [
  // Project P001
  { id: 'T101', projectId: 'P001', name: 'Fase 1: Planificación y Análisis', assignee: 'Ana García', startDate: '2024-09-01', endDate: '2024-09-10', status: TaskStatus.Completed, dependencies: [], isCritical: false },
  { id: 'T102', projectId: 'P001', name: 'Aprovisionamiento de Hardware', assignee: 'Equipo Infra', startDate: '2024-09-11', endDate: '2024-09-25', status: TaskStatus.Completed, dependencies: ['T101'], isCritical: false },
  { id: 'T103', projectId: 'P001', name: 'Instalación de SO y Software Base', assignee: 'Equipo Infra', startDate: '2024-09-26', endDate: '2024-10-10', status: TaskStatus.InProgress, dependencies: ['T102'], isCritical: false },
  { id: 'T104', projectId: 'P001', name: 'Configuración de Red (VPC, Subnets)', assignee: 'Equipo Redes', startDate: '2024-10-01', endDate: '2024-10-15', status: TaskStatus.InProgress, dependencies: ['T102'], isCritical: false },
  { id: 'T105', projectId: 'P001', name: 'Configuración de Bases de Datos', assignee: 'DBA Team', startDate: '2024-10-16', endDate: '2024-11-05', status: TaskStatus.Delayed, dependencies: ['T103', 'T104'], isCritical: false },
  { id: 'T106', projectId: 'P001', name: 'Pruebas de Integración', assignee: 'QA Team', startDate: '2024-11-06', endDate: '2024-11-20', status: TaskStatus.AtRisk, dependencies: ['T105'], isCritical: false },
  { id: 'T107', projectId: 'P001', name: 'Despliegue en Producción', assignee: 'Ana García', startDate: '2024-11-21', endDate: '2024-12-05', status: TaskStatus.NotStarted, dependencies: ['T106'], isCritical: false },
  { id: 'T108', projectId: 'P001', name: 'Documentación Final', assignee: 'Ana García', startDate: '2024-12-06', endDate: '2024-12-20', status: TaskStatus.NotStarted, dependencies: ['T107'], isCritical: false },

  // Project P002
  { id: 'T201', projectId: 'P002', name: 'Kick-off y Requisitos', assignee: 'Carlos Pérez', startDate: '2024-09-01', endDate: '2024-09-20', status: TaskStatus.Delayed, dependencies: [], isCritical: false },
  { id: 'T202', projectId: 'P002', name: 'Diseño UX/UI', assignee: 'Diseñador', startDate: '2024-09-21', endDate: '2024-10-15', status: TaskStatus.AtRisk, dependencies: ['T201'], isCritical: false },
  { id: 'T203', projectId: 'P002', name: 'Desarrollo de Backend', assignee: 'Dev Team', startDate: '2024-10-16', endDate: '2024-12-15', status: TaskStatus.InProgress, dependencies: ['T202'], isCritical: false },
  { id: 'T204', projectId: 'P002', name: 'Desarrollo de Frontend', assignee: 'Dev Team', startDate: '2024-10-16', endDate: '2024-12-15', status: TaskStatus.InProgress, dependencies: ['T202'], isCritical: false },
  { id: 'T205', projectId: 'P002', name: 'Integración y Pruebas', assignee: 'QA Team', startDate: '2024-12-16', endDate: '2025-01-31', status: TaskStatus.NotStarted, dependencies: ['T203', 'T204'], isCritical: false },
  { id: 'T206', projectId: 'P002', name: 'UAT con Cliente', assignee: 'Carlos Pérez', startDate: '2025-02-01', endDate: '2025-02-28', status: TaskStatus.NotStarted, dependencies: ['T205'], isCritical: false },
];
