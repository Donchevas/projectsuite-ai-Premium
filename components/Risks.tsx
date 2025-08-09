import React, { useState, useMemo } from 'react';
import { RISKS, PROJECTS, TASKS, REPORTS } from '../constants';
import { Risk, RiskImpact, RiskProbability, PotentialRisk } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { BrainCircuitIcon } from './Icons';

const impactColor: { [key in RiskImpact]: string } = {
    [RiskImpact.High]: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-500',
    [RiskImpact.Medium]: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-yellow-500',
    [RiskImpact.Low]: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-500',
};

const probabilityColor: { [key in RiskProbability]: string } = {
    [RiskProbability.High]: 'text-red-600 dark:text-red-400',
    [RiskProbability.Medium]: 'text-yellow-600 dark:text-yellow-400',
    [RiskProbability.Low]: 'text-green-600 dark:text-green-400',
};


const RiskCard: React.FC<{ risk: Risk }> = ({ risk }) => {
    const project = PROJECTS.find(p => p.id === risk.projectId);
    const isOutdated = new Date(risk.lastUpdated) < new Date(new Date().setDate(new Date().getDate() - 7));
    
    return (
        <div className={`relative bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md border-l-4 ${impactColor[risk.impact]}`}>
             {isOutdated && (
                <div className="absolute top-2 right-2 text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full animate-pulse">
                    No actualizado
                </div>
            )}
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-2">{risk.name}</h3>
                <span className={`text-sm font-semibold px-2 py-1 rounded-md ${impactColor[risk.impact]}`}>{risk.impact}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Proyecto: <span className="font-medium text-gray-700 dark:text-gray-300">{project?.name || 'N/A'}</span>
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                    <p className="text-gray-500 dark:text-gray-400">Probabilidad</p>
                    <p className={`font-semibold ${probabilityColor[risk.probability]}`}>{risk.probability}</p>
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400">Responsable</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300">{risk.owner}</p>
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400">Estado</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300">{risk.status}</p>
                </div>
                 <div>
                    <p className="text-gray-500 dark:text-gray-400">Última Act.</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300">{risk.lastUpdated}</p>
                </div>
            </div>

            <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Plan de Mitigación</p>
                <p className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">{risk.mitigationPlan}</p>
            </div>
        </div>
    );
};

const PotentialRiskCard: React.FC<{ risk: PotentialRisk; onAdd: (risk: PotentialRisk) => void; onDismiss: (id: string) => void }> = ({ risk, onAdd, onDismiss }) => {
    const project = PROJECTS.find(p => p.id === risk.projectId);
    return (
        <div className="bg-indigo-50 dark:bg-gray-800/50 p-5 rounded-lg shadow-md border-l-4 border-indigo-500 transition-opacity duration-500 ease-in-out">
            <h4 className="font-bold text-indigo-800 dark:text-indigo-200 text-base mb-2">{risk.name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Proyecto Sugerido: <span className="font-medium text-gray-700 dark:text-gray-300">{project?.name || 'N/A'}</span>
            </p>
            <div className="mb-4 space-y-3 text-sm">
                <div>
                    <p className="font-semibold text-gray-600 dark:text-gray-300">Justificación (Análisis de IA):</p>
                    <p className="text-gray-700 dark:text-gray-200 italic">{risk.justification}</p>
                </div>
                <div>
                    <p className="font-semibold text-gray-600 dark:text-gray-300">Sugerencia de Mitigación:</p>
                    <p className="text-gray-700 dark:text-gray-200">{risk.mitigationPlan}</p>
                </div>
            </div>
            <div className="flex justify-end space-x-2">
                <button onClick={() => onDismiss(risk.id)} className="text-xs font-medium text-gray-600 dark:text-gray-400 px-3 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">Descartar</button>
                <button onClick={() => onAdd(risk)} className="text-xs font-medium text-white bg-blue-600 px-3 py-1 rounded-md hover:bg-blue-700">Añadir al Registro</button>
            </div>
        </div>
    );
}

const Risks: React.FC = () => {
    const [risks, setRisks] = useState<Risk[]>(RISKS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    type NewRiskData = Omit<Risk, 'id' | 'lastUpdated'>;

    const initialNewRiskState: NewRiskData = {
        projectId: '',
        name: '',
        impact: RiskImpact.Low,
        probability: RiskProbability.Low,
        owner: '',
        mitigationPlan: '',
        status: 'Abierto',
    };
    const [newRiskData, setNewRiskData] = useState<NewRiskData>(initialNewRiskState);

    const [filter, setFilter] = useState('Todos');
    
    const [potentialRisks, setPotentialRisks] = useState<PotentialRisk[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState('');


    const filteredRisks = useMemo(() => {
        if (filter === 'Todos') return risks;
        if (filter === 'Críticos') return risks.filter(r => r.impact === RiskImpact.High && r.probability === RiskProbability.High);
        if (filter === 'Altos') return risks.filter(r => r.impact === RiskImpact.High || r.probability === RiskProbability.High);
        return risks;
    }, [filter, risks]);

    const handleNewRiskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewRiskData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddRisk = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRiskData.name || !newRiskData.projectId || !newRiskData.owner || !newRiskData.mitigationPlan) {
            alert('Por favor, complete todos los campos requeridos.');
            return;
        }

        const newRisk: Risk = {
            ...newRiskData,
            id: `R${Date.now()}`,
            lastUpdated: new Date().toISOString().split('T')[0],
        };

        setRisks(prev => [newRisk, ...prev]);
        setIsModalOpen(false);
        setNewRiskData(initialNewRiskState);
    };

    const handleAnalyzeRisks = async () => {
        setIsAnalyzing(true);
        setAnalysisError('');
        setPotentialRisks([]);
    
        try {
            if (!import.meta.env.VITE_API_KEY) throw new Error("La variable de entorno VITE_API_KEY no está configurada.");
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
    
            const projectsData = PROJECTS.map(p => `ID: ${p.id}, Nombre: ${p.name}, Estado: ${p.status}, Progreso: ${p.progress}%, Costo: ${p.costStatus}`).join('\n');
            const tasksData = TASKS.map(t => `ProyectoID: ${t.projectId}, Tarea: ${t.name}, Estado: ${t.status}, Es Crítica: ${t.isCritical}`).join('\n');
            const reportsData = REPORTS.map(r => `ProyectoID: ${r.projectId}, Reporte: Actividades: ${r.activitiesDone}, Próximos Pasos: ${r.nextSteps}, Riesgos manuales: ${r.newRisks}`).join('\n');
            const existingRisksData = risks.map(r => `ProyectoID: ${r.projectId}, Riesgo: ${r.name}`).join('\n');
    
            const prompt = `
                Actúa como un experto Analista de Riesgos de Proyectos. Tu tarea es identificar proactivamente riesgos potenciales que no han sido registrados.
                Analiza de forma cruzada la siguiente información de proyectos:
                
                1.  **DATOS DE PROYECTOS:**\n${projectsData}
                2.  **DATOS DE TAREAS (CRONOGRAMA):**\n${tasksData}
                3.  **DATOS DE REPORTES SEMANALES (CUALITATIVOS):**\n${reportsData}
                4.  **RIESGOS YA REGISTRADOS (PARA EVITAR DUPLICADOS):**\n${existingRisksData}
    
                Busca patrones y señales de alerta, tales como:
                - Proyectos en estado 'At Risk' u 'Off Track' con tareas críticas retrasadas.
                - Proyectos 'Over Budget' (Sobre Presupuesto) con bajo progreso.
                - Menciones de "problema", "bloqueo", "retraso" en los reportes semanales que no correspondan a un riesgo ya registrado.
                - Tareas críticas en riesgo o retrasadas.
    
                Basado en tu análisis, genera una lista de 2 a 3 riesgos potenciales. Sé conciso y directo.
                Formatea la salida como un objeto JSON que siga el esquema proporcionado.`;
    
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    potentialRisks: {
                        type: Type.ARRAY,
                        description: "Lista de riesgos potenciales identificados.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                projectId: { type: Type.STRING, description: "El ID del proyecto afectado (ej. 'P001')."},
                                name: { type: Type.STRING, description: "Un nombre claro y conciso para el riesgo."},
                                justification: { type: Type.STRING, description: "La razón por la cual identificaste este riesgo, basado en los datos."},
                                mitigationPlan: { type: Type.STRING, description: "Una sugerencia de plan de mitigación inicial."},
                                impact: { type: Type.STRING, description: `El impacto potencial. Valores posibles: ${Object.values(RiskImpact).join(', ')}.`},
                                probability: { type: Type.STRING, description: `La probabilidad de ocurrencia. Valores posibles: ${Object.values(RiskProbability).join(', ')}.`}
                            },
                            required: ["projectId", "name", "justification", "mitigationPlan", "impact", "probability"]
                        }
                    }
                },
                required: ['potentialRisks']
            };
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema
                }
            });
    
            const result = JSON.parse(response.text);
            const risksWithIds = result.potentialRisks.map((r: Omit<PotentialRisk, 'id'>) => ({
                ...r,
                id: `PR-${Date.now()}-${Math.random()}`
            }));
            setPotentialRisks(risksWithIds);
    
        } catch (err) {
            console.error("Error analyzing risks:", err);
            const msg = (err instanceof Error) ? err.message : 'Ocurrió un error desconocido.';
            setAnalysisError(`No se pudo completar el análisis. Error: ${msg}`);
        } finally {
            setIsAnalyzing(false);
        }
    }
    
    const handleDismissPotentialRisk = (id: string) => {
        setPotentialRisks(prev => prev.filter(r => r.id !== id));
    };

    const handleAddPotentialRisk = (potentialRisk: PotentialRisk) => {
        const riskToPreFill: NewRiskData = {
            projectId: potentialRisk.projectId,
            name: potentialRisk.name,
            impact: potentialRisk.impact,
            probability: potentialRisk.probability,
            owner: '', // User must assign an owner
            mitigationPlan: potentialRisk.mitigationPlan,
            status: 'Abierto',
        };
        setNewRiskData(riskToPreFill);
        setIsModalOpen(true);
        handleDismissPotentialRisk(potentialRisk.id);
    };

    const formInputClass = "bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";
    
    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión de Riesgos</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleAnalyzeRisks}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-wait font-semibold"
                    >
                        <BrainCircuitIcon className="h-5 w-5" />
                        {isAnalyzing ? 'Analizando...' : 'Analizar Riesgos con IA'}
                    </button>
                    <button 
                        onClick={() => {
                            setNewRiskData(initialNewRiskState);
                            setIsModalOpen(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors">
                        Añadir Nuevo Riesgo
                    </button>
                </div>
            </div>

            {(isAnalyzing || analysisError || potentialRisks.length > 0) && (
                <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Riesgos Potenciales Detectados por IA</h2>
                    {isAnalyzing && <div className="flex items-center text-gray-600 dark:text-gray-300"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mr-3"></div>Analizando datos de todos los proyectos...</div>}
                    {analysisError && <p className="text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">{analysisError}</p>}
                    {!isAnalyzing && potentialRisks.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {potentialRisks.map(pr => (
                                <PotentialRiskCard 
                                    key={pr.id} 
                                    risk={pr}
                                    onDismiss={handleDismissPotentialRisk}
                                    onAdd={handleAddPotentialRisk}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

             <div className="flex items-center space-x-2 mb-6">
                <span className="text-gray-600 dark:text-gray-300">Filtrar por criticidad:</span>
                {['Todos', 'Críticos', 'Altos'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRisks.map(risk => (
                    <RiskCard key={risk.id} risk={risk} />
                ))}
            </div>
             {filteredRisks.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 col-span-full">
                    No hay riesgos que coincidan con el filtro seleccionado.
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl transform transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Registrar Nuevo Riesgo</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Cerrar modal">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddRisk} className="space-y-4">
                             <div>
                                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombre del Riesgo</label>
                                <input type="text" name="name" id="name" value={newRiskData.name} onChange={handleNewRiskChange} className={formInputClass} required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="projectId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Proyecto Asociado</label>
                                    <select name="projectId" id="projectId" value={newRiskData.projectId} onChange={handleNewRiskChange} className={formInputClass} required>
                                        <option value="" disabled>Seleccionar proyecto</option>
                                        {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="owner" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Responsable</label>
                                    <input type="text" name="owner" id="owner" value={newRiskData.owner} onChange={handleNewRiskChange} className={formInputClass} required placeholder="Nombre del responsable" />
                                </div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="impact" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Impacto</label>
                                    <select name="impact" id="impact" value={newRiskData.impact} onChange={handleNewRiskChange} className={formInputClass}>
                                        {Object.values(RiskImpact).map(val => <option key={val} value={val}>{val}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="probability" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Probabilidad</label>
                                     <select name="probability" id="probability" value={newRiskData.probability} onChange={handleNewRiskChange} className={formInputClass}>
                                        {Object.values(RiskProbability).map(val => <option key={val} value={val}>{val}</option>)}
                                    </select>
                                </div>
                                 <div>
                                    <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Estado</label>
                                     <select name="status" id="status" value={newRiskData.status} onChange={handleNewRiskChange} className={formInputClass}>
                                        <option value="Abierto">Abierto</option>
                                        <option value="Monitoreando">Monitoreando</option>
                                        <option value="Cerrado">Cerrado</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="mitigationPlan" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Plan de Mitigación</label>
                                <textarea name="mitigationPlan" id="mitigationPlan" rows={3} value={newRiskData.mitigationPlan} onChange={handleNewRiskChange} className={formInputClass} required placeholder="Describa las acciones para mitigar o controlar el riesgo..."></textarea>
                            </div>
                             <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-colors">
                                    Guardar Riesgo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Risks;