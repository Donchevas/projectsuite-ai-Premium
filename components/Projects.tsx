
import React, { useState, useMemo } from 'react';
import { PROJECTS } from '../constants';
import { Project, ProjectStatus, CostStatus } from '../types';

const statusColors: { [key in ProjectStatus]: string } = {
  [ProjectStatus.OnTrack]: 'bg-green-500',
  [ProjectStatus.AtRisk]: 'bg-yellow-500',
  [ProjectStatus.OffTrack]: 'bg-red-500',
  [ProjectStatus.Completed]: 'bg-blue-500',
  [ProjectStatus.OnHold]: 'bg-gray-500',
};

const costStatusStyles: { [key in CostStatus]: string } = {
    [CostStatus.UnderBudget]: 'border-green-500 text-green-600 dark:text-green-400',
    [CostStatus.OnBudget]: 'border-blue-500 text-blue-600 dark:text-blue-400',
    [CostStatus.OverBudget]: 'border-red-500 text-red-600 dark:text-red-400',
};

const Projects: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>(PROJECTS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    type NewProjectData = Omit<Project, 'id' | 'costStatus'>;

    const initialNewProjectState: NewProjectData = {
        name: '',
        progress: 0,
        status: ProjectStatus.OnTrack,
        client: '',
        endDate: '',
        projectManager: '',
        budget: 0,
        spent: 0,
    };
    const [newProjectData, setNewProjectData] = useState<NewProjectData>(initialNewProjectState);

    const [filters, setFilters] = useState({ pm: '', client: '', status: '' });

    const projectManagers = useMemo(() => [...new Set(PROJECTS.map(p => p.projectManager).filter(pm => pm))], []);
    const clients = useMemo(() => [...new Set(projects.map(p => p.client))], [projects]);
    const statuses = useMemo(() => Object.values(ProjectStatus), []);

    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            return (filters.pm === '' || project.projectManager === filters.pm) &&
                   (filters.client === '' || project.client === filters.client) &&
                   (filters.status === '' || project.status === filters.status);
        });
    }, [filters, projects]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleNewProjectChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericFields = ['progress', 'budget', 'spent'];
        setNewProjectData(prev => ({ ...prev, [name]: numericFields.includes(name) ? Number(value) : value }));
    };

    const calculateCostStatus = (budget: number, spent: number, progress: number): CostStatus => {
        if (budget <= 0) return CostStatus.OnBudget;
        if (spent > budget) return CostStatus.OverBudget;

        const progressRatio = progress / 100;
        const costRatio = spent / budget;
        
        const deviation = costRatio - progressRatio;

        if (deviation > 0.15) return CostStatus.OverBudget; 
        if (deviation < -0.15) return CostStatus.UnderBudget;
        
        return CostStatus.OnBudget;
    };

    const handleAddProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectData.name || !newProjectData.client || !newProjectData.endDate || !newProjectData.projectManager || newProjectData.budget <= 0) {
            alert('Por favor, complete todos los campos requeridos, incluyendo un presupuesto mayor a cero.');
            return;
        }
        
        const costStatus = calculateCostStatus(newProjectData.budget, newProjectData.spent, newProjectData.progress);

        const projectToAdd: Project = {
            ...newProjectData,
            id: `P${Date.now()}`,
            costStatus: costStatus,
        };
        setProjects(prev => [projectToAdd, ...prev]);
        setIsModalOpen(false);
        setNewProjectData(initialNewProjectState);
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    }

    const formInputClass = "bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Proyectos</h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors">
                    Añadir Nuevo Proyecto
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 col-span-full">Filtros</h3>
                    <select name="pm" onChange={handleFilterChange} value={filters.pm} className={formInputClass}>
                        <option value="">Todos los PM</option>
                        {projectManagers.map(pm => <option key={pm} value={pm}>{pm}</option>)}
                    </select>
                    <select name="client" onChange={handleFilterChange} value={filters.client} className={formInputClass}>
                        <option value="">Todos los Clientes</option>
                        {clients.map(client => <option key={client} value={client}>{client}</option>)}
                    </select>
                     <select name="status" onChange={handleFilterChange} value={filters.status} className={formInputClass}>
                        <option value="">Todos los Estados</option>
                        {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nombre del Proyecto</th>
                            <th scope="col" className="px-6 py-3">Avance</th>
                            <th scope="col" className="px-6 py-3">Estado</th>
                            <th scope="col" className="px-6 py-3">Cliente</th>
                            <th scope="col" className="px-6 py-3">Presupuesto</th>
                            <th scope="col" className="px-6 py-3">Gastado</th>
                            <th scope="col" className="px-6 py-3">Estado Costo</th>
                            <th scope="col" className="px-6 py-3">Fecha Fin</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProjects.map((project: Project) => (
                            <tr key={project.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{project.name}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mr-2">
                                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                                        </div>
                                        <span className="w-10 text-right">{project.progress}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full`}>
                                        <span className={`w-2 h-2 mr-2 rounded-full ${statusColors[project.status]}`}></span>
                                        <span className="text-gray-800 dark:text-gray-200">{project.status}</span>
                                    </span>
                                </td>
                                <td className="px-6 py-4">{project.client}</td>
                                <td className="px-6 py-4">{formatCurrency(project.budget)}</td>
                                <td className="px-6 py-4">{formatCurrency(project.spent)}</td>
                                <td className="px-6 py-4">
                                     <span className={`text-xs font-semibold px-2 py-1 rounded-md border ${costStatusStyles[project.costStatus]}`}>{project.costStatus}</span>
                                </td>
                                <td className="px-6 py-4">{project.endDate}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredProjects.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No se encontraron proyectos con los filtros seleccionados.
                    </div>
                 )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl transform transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Añadir Nuevo Proyecto</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Cerrar modal">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddProject} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombre del Proyecto</label>
                                <input type="text" name="name" id="name" value={newProjectData.name} onChange={handleNewProjectChange} className={formInputClass} required />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="client" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Cliente</label>
                                    <input type="text" name="client" id="client" value={newProjectData.client} onChange={handleNewProjectChange} className={formInputClass} required />
                                </div>
                                <div>
                                    <label htmlFor="projectManager" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Project Manager</label>
                                    <select name="projectManager" id="projectManager" value={newProjectData.projectManager} onChange={handleNewProjectChange} className={formInputClass} required>
                                        <option value="" disabled>Seleccionar PM</option>
                                        {[...projectManagers, "Nuevo PM"].map(pm => <option key={pm} value={pm}>{pm}</option>)}
                                    </select>
                                </div>
                            </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="budget" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Presupuesto (€)</label>
                                    <input type="number" name="budget" id="budget" value={newProjectData.budget} onChange={handleNewProjectChange} className={formInputClass} required min="1"/>
                                </div>
                                <div>
                                    <label htmlFor="spent" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Gastado (€)</label>
                                    <input type="number" name="spent" id="spent" value={newProjectData.spent} onChange={handleNewProjectChange} className={formInputClass} required min="0"/>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Estado</label>
                                    <select name="status" id="status" value={newProjectData.status} onChange={handleNewProjectChange} className={formInputClass}>
                                        {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Fecha Fin Estimada</label>
                                    <input type="date" name="endDate" id="endDate" value={newProjectData.endDate} onChange={handleNewProjectChange} className={formInputClass} required />
                                </div>
                            </div>
                            
                            <div>
                                <label htmlFor="progress" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Avance ({newProjectData.progress}%)</label>
                                <input type="range" name="progress" id="progress" min="0" max="100" value={newProjectData.progress} onChange={handleNewProjectChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                            </div>
                            
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-colors">
                                    Guardar Proyecto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;