import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { PROJECTS, PROJECTS_BASELINE } from '../constants';
import { IaToolsIcon, ScopeControlIcon } from './Icons';

const Loader: React.FC<{text: string}> = ({ text }) => (
    <div className="flex flex-col items-center justify-center text-center h-full p-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">{text}</p>
    </div>
);

const FormattedResultCard: React.FC<{ title: string; content: string; icon: React.ReactNode }> = ({ title, content, icon }) => {
    const createMarkup = (htmlString: string) => ({ __html: htmlString });
    const contentWithBreaks = content.replace(/\n/g, '<br />');
    const contentWithBold = contentWithBreaks.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    let listItems: string[] = [];
    const elements: JSX.Element[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
                    {listItems.map((item, idx) => (
                        <li key={idx} dangerouslySetInnerHTML={createMarkup(item)} />
                    ))}
                </ul>
            );
            listItems = [];
        }
    };
    
    contentWithBold.split('<br />').forEach((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('* ')) {
            listItems.push(trimmedLine.substring(2).trim());
        } else {
            flushList();
            if (trimmedLine) {
                 elements.push(<div key={`p-${elements.length}`} dangerouslySetInnerHTML={createMarkup(trimmedLine)} />);
            }
        }
    });
    flushList();

    return (
        <div className="bg-blue-50 dark:bg-gray-900/30 p-6 rounded-lg shadow-inner border border-blue-200 dark:border-blue-800 h-full">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                {icon}
                {title}
            </h3>
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                 {elements}
            </div>
        </div>
    );
};

const IaTools: React.FC = () => {
    // State for Summary Tool
    const [inputText, setInputText] = useState('');
    const [summary, setSummary] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState('');

    // State for Scope Control Tool
    const [selectedProjectId, setSelectedProjectId] = useState<string>(PROJECTS_BASELINE[0]?.id || '');
    const [scopeAnalysis, setScopeAnalysis] = useState('');
    const [isScopeLoading, setIsScopeLoading] = useState(false);
    const [scopeError, setScopeError] = useState('');


    const handleGenerateSummary = async () => {
        if (!inputText.trim()) {
            setSummaryError('Por favor, introduce un texto para resumir.');
            return;
        }
        
        setIsSummaryLoading(true);
        setSummaryError('');
        setSummary('');

        try {
            if (!import.meta.env.VITE_API_KEY) throw new Error("La variable de entorno VITE_API_KEY no está configurada.");
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
            const prompt = `Eres un asistente experto en gestión de proyectos. Analiza el siguiente texto y genera un resumen ejecutivo conciso en español. El resumen debe destacar: Decisiones Clave, Acciones Pendientes y Riesgos. Usa viñetas y negritas para una lectura rápida. El texto es:\n\n---\n\n${inputText}`;

            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setSummary(response.text);
        } catch (err) {
            console.error('Error generating summary:', err);
            const msg = (err instanceof Error) ? err.message : 'Ocurrió un error desconocido.';
            setSummaryError(`No se pudo generar el resumen. Error: ${msg}`);
        } finally {
            setIsSummaryLoading(false);
        }
    };

    const handleAnalyzeScope = async () => {
        if (!selectedProjectId) {
            setScopeError('Por favor, selecciona un proyecto.');
            return;
        }

        setIsScopeLoading(true);
        setScopeError('');
        setScopeAnalysis('');

        try {
            if (!import.meta.env.VITE_API_KEY) throw new Error("La variable de entorno VITE_API_KEY no está configurada.");
            
            const currentProject = PROJECTS.find(p => p.id === selectedProjectId);
            const baselineProject = PROJECTS_BASELINE.find(p => p.id === selectedProjectId);

            if (!currentProject || !baselineProject) throw new Error("No se encontraron los datos del proyecto o su línea base.");

            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
            
            const prompt = `Como analista de proyectos experto, compara la planificación inicial (Línea Base) con el estado actual del proyecto. Cuantifica el impacto de las desviaciones (scope creep) y proporciona un análisis claro en español.

            **Datos de la Línea Base:**
            - Fecha de Fin Planeada: ${baselineProject.endDate}
            - Presupuesto Original: ${baselineProject.budget.toLocaleString('es-ES')} €

            **Datos del Estado Actual:**
            - Fecha de Fin Estimada: ${currentProject.endDate}
            - Presupuesto Actual: ${currentProject.budget.toLocaleString('es-ES')} €
            - Gasto Actual: ${currentProject.spent.toLocaleString('es-ES')} €
            - Progreso: ${currentProject.progress}%
            - Estado General: ${currentProject.status}
            - Estado de Costo: ${currentProject.costStatus}

            **Análisis Requerido:**
            1.  **Análisis de Alcance (Scope):** Identifica si hubo cambios en presupuesto o fechas.
            2.  **Impacto en Tiempo:** Calcula la desviación en días entre la fecha final actual y la de la línea base.
            3.  **Impacto en Costo:** Calcula la desviación porcentual y absoluta del presupuesto actual contra el original. Analiza la relación gasto/progreso.
            4.  **Diagnóstico General:** Basado en los datos, ofrece un diagnóstico claro sobre la salud del proyecto respecto a su planificación inicial.
            
            Formato: Usa viñetas y negritas para mayor claridad.`;

            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setScopeAnalysis(response.text);

        } catch (err) {
            console.error('Error analyzing scope:', err);
            const msg = (err instanceof Error) ? err.message : 'Ocurrió un error desconocido.';
            setScopeError(`No se pudo analizar la desviación. Error: ${msg}`);
        } finally {
            setIsScopeLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-12">
            {/* Communication Summary Tool */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Resumen Inteligente de Comunicación</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Pega un acta de reunión o una cadena de correos y obtén un resumen ejecutivo al instante.</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="inputText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Texto a Analizar</label>
                        <textarea id="inputText" value={inputText} onChange={(e) => setInputText(e.target.value)} rows={15} className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition" placeholder="Ej: Acta de reunión del 15 de Julio..."/>
                    </div>
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resultado del Resumen</label>
                        <div className="flex-grow bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1 min-h-[300px]">
                            {isSummaryLoading ? <Loader text="Generando tu resumen..."/> : summary ? <FormattedResultCard title="Resumen Ejecutivo" content={summary} icon={<IaToolsIcon className="h-5 w-5 mr-2" />} /> : <div className="flex items-center justify-center h-full text-center text-gray-500"><p>El resumen aparecerá aquí.</p></div>}
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                    <button onClick={handleGenerateSummary} disabled={isSummaryLoading || !inputText.trim()} className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center font-semibold">
                        <IaToolsIcon className="h-5 w-5 mr-2" />{isSummaryLoading ? 'Analizando...' : 'Generar Resumen'}
                    </button>
                    {summaryError && <p className="text-sm text-red-600 dark:text-red-400">{summaryError}</p>}
                </div>
            </div>

            {/* Scope Control Tool */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Control de Alcance Inteligente</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Compara la planificación inicial con el estado actual del proyecto para cuantificar el impacto de los cambios (scope creep).</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                         <label htmlFor="scope-project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selecciona un Proyecto</label>
                        <select id="scope-project" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                           {PROJECTS_BASELINE.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                         <button onClick={handleAnalyzeScope} disabled={isScopeLoading || !selectedProjectId} className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center font-semibold w-full justify-center">
                            <ScopeControlIcon className="h-5 w-5 mr-2" />{isScopeLoading ? 'Analizando...' : 'Analizar Desviación con IA'}
                        </button>
                    </div>
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Análisis de Desviación</label>
                        <div className="flex-grow bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1 min-h-[300px]">
                            {isScopeLoading ? <Loader text="Analizando desviación..."/> : scopeAnalysis ? <FormattedResultCard title="Análisis de Desviación" content={scopeAnalysis} icon={<ScopeControlIcon className="h-5 w-5 mr-2"/>} /> : <div className="flex items-center justify-center h-full text-center text-gray-500"><p>El análisis del alcance aparecerá aquí.</p></div>}
                        </div>
                    </div>
                </div>
                 {scopeError && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{scopeError}</p>}
            </div>
        </div>
    );
};

export default IaTools;