export enum ProjectStatus {
  OnTrack = 'On Track',
  AtRisk = 'At Risk',
  OffTrack = 'Off Track',
  Completed = 'Completed',
  OnHold = 'On Hold'
}

export enum CostStatus {
  UnderBudget = 'Bajo Presupuesto',
  OnBudget = 'En Presupuesto',
  OverBudget = 'Sobre Presupuesto',
}

export enum RiskImpact {
  High = 'Alto',
  Medium = 'Medio',
  Low = 'Bajo',
}

export enum RiskProbability {
    High = 'Alta',
    Medium = 'Media',
    Low = 'Baja',
}

export enum MilestoneStatus {
  Pending = 'Pendiente',
  InProgress = 'En Curso',
  Completed = 'Entregado',
  Delayed = 'Observado'
}

export enum TaskStatus {
  Completed = 'Completada',
  InProgress = 'En Progreso',
  AtRisk = 'En Riesgo',
  Delayed = 'Retrasada',
  NotStarted = 'No Iniciada',
}

export interface Project {
  id: string;
  name: string;
  progress: number;
  status: ProjectStatus;
  client: string;
  endDate: string;
  projectManager: string;
  budget: number;
  spent: number;
  costStatus: CostStatus;
}

export interface Risk {
  id: string;
  projectId: string;
  name: string;
  impact: RiskImpact;
  probability: RiskProbability;
  owner: string;
  mitigationPlan: string;
  status: 'Abierto' | 'Cerrado' | 'Monitoreando';
  lastUpdated: string;
}

export interface PotentialRisk {
  id: string;
  projectId: string;
  name: string;
  justification: string;
  mitigationPlan: string;
  impact: RiskImpact;
  probability: RiskProbability;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  status: MilestoneStatus;
  dueDate: string;
}

export interface Report {
  id: string;
  projectId: string;
  week: string;
  activitiesDone: string;
  nextSteps: string;
  newRisks: string;
  submittedBy: string;
  date: string;
}

export interface LessonLearned {
  id: string;
  projectId: string;
  category: 'Planificación' | 'Ejecución' | 'Comunicación' | 'Gestión de Stakeholders';
  description: string;
  votes: number;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  assignee: string;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  dependencies: string[];
  isCritical: boolean;
}

export interface Slide {
  title: string;
  content: string;
  speakerNotes: string;
}


export type ViewType = 'dashboard' | 'projects' | 'risks' | 'milestones' | 'gantt' | 'reports' | 'lessons' | 'ia-tools' | 'client';