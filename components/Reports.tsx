import React, { useState } from 'react';
import { PROJECTS, REPORTS, RISKS, MILESTONES } from '../constants';
import { Report, Slide, Project } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import PptxGenJS from 'pptxgenjs';
import { PresentationIcon, ChevronLeftIcon, ChevronRightIcon, ExportIcon } from './Icons';


const ReportCard: React.FC<{report: Report, project?: Project}> = ({ report, project }) => {
    return (
         <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-800 dark:text-white">{report.week || `Reporte de ${project?.name}`}</h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">{report.date}</span>
            </div>
             <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Enviado por: {report.submittedBy}</p>
             <div className="space-y-3 text-sm">
                <div>
                    <p className="font-semibold text-gray-600 dark:text-gray-300">Actividades Realizadas:</p>
                    <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{report.activitiesDone}</p>
                </div>
                <div>
                    <p className="font-semibold text-gray-600 dark:text-gray-300">Próximos Pasos:</p>
                    <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{report.nextSteps}</p>
                </div>
                 <div>
                    <p className="font-semibold text-gray-600 dark:text-gray-300">Nuevos Riesgos:</p>
                    <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{report.newRisks}</p>
                </div>
             </div>
             <button disabled className="mt-4 text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline">Ver PDF (Próximamente)</button>
         </div>
    );
}

const FormattedContent: React.FC<{ content: string }> = ({ content }) => {
    const createMarkup = (htmlString: string) => ({ __html: htmlString });
    const contentWithBold = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="space-y-2 my-2">
                    {listItems.map((item, idx) => (
                        <li key={idx} className="flex items-start">
                            <span className="text-blue-500 mr-2 mt-1">&#9679;</span>
                            <span className="flex-1" dangerouslySetInnerHTML={createMarkup(item)} />
                        </li>
                    ))}
                </ul>
            );
            listItems = [];
        }
    };

    contentWithBold.split('\n').forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('* ')) {
            listItems.push(trimmedLine.substring(2).trim());
        } else {
            flushList();
            if (trimmedLine) {
                elements.push(<p key={`p-${index}`} className="mb-2" dangerouslySetInnerHTML={createMarkup(trimmedLine)} />);
            }
        }
    });
    flushList();
    return <>{elements}</>;
};

const Reports: React.FC = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // State for manual report form
    const [reports, setReports] = useState<Report[]>(REPORTS);
    const [reportProjectId, setReportProjectId] = useState<string>('');
    const [reportDate, setReportDate] = useState<string>(today);
    const [activitiesDone, setActivitiesDone] = useState('');
    const [nextSteps, setNextSteps] = useState('');
    const [newRisks, setNewRisks] = useState('');

    // State for presentation generator
    const [selectedProjectIdForPPT, setSelectedProjectIdForPPT] = useState<string>(PROJECTS[0]?.id || '');
    const [presentationDate, setPresentationDate] = useState<string>(today);
    const [targetAudience, setTargetAudience] = useState<'Cliente' | 'Dirección Interna'>('Cliente');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedSlides, setGeneratedSlides] = useState<Slide[]>([]);
    const [pptError, setPptError] = useState('');
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const formInputClass = "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";
    const formTextareaClass = "block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";

    const handleAddReport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportProjectId || !activitiesDone.trim() || !nextSteps.trim()) {
            alert('Por favor, selecciona un proyecto y completa los campos de actividades y próximos pasos.');
            return;
        }

        const newReport: Report = {
            id: `REP${Date.now()}`,
            projectId: reportProjectId,
            date: reportDate,
            activitiesDone,
            nextSteps,
            newRisks: newRisks.trim() || 'Ninguno.',
            submittedBy: 'Admin', // Hardcoded for demo
            week: '', // Week is now implicit by date
        };

        setReports(prev => [newReport, ...prev]);

        // Reset form
        setReportProjectId('');
        setActivitiesDone('');
        setNextSteps('');
        setNewRisks('');
        setReportDate(today);
    };

    const handleGeneratePresentation = async () => {
        if (!selectedProjectIdForPPT) {
            setPptError('Por favor, selecciona un proyecto.');
            return;
        }

        setIsGenerating(true);
        setPptError('');
        setGeneratedSlides([]);
        setCurrentSlideIndex(0);

        try {
            if (!process.env.API_KEY) {
                throw new Error("API_KEY no está configurada.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const project = PROJECTS.find(p => p.id === selectedProjectIdForPPT);
            const risks = RISKS.filter(r => r.projectId === selectedProjectIdForPPT);
            const milestones = MILESTONES.filter(m => m.projectId === selectedProjectIdForPPT);

            // Find the closest report to the selected presentation date
            const selectedDate = new Date(presentationDate).getTime();
            const relevantReport = reports
                .filter(r => r.projectId === selectedProjectIdForPPT)
                .sort((a, b) => Math.abs(new Date(a.date).getTime() - selectedDate) - Math.abs(new Date(b.date).getTime() - selectedDate))[0];

            let reportContext = "No se encontró un reporte semanal manual cercano a esta fecha para añadir contexto.";
            if (relevantReport) {
                reportContext = `
                **Actividades Recientes (del reporte del ${relevantReport.date}):** ${relevantReport.activitiesDone}
                **Próximos Pasos Definidos:** ${relevantReport.nextSteps}
                **Riesgos Mencionados:** ${relevantReport.newRisks}
                `;
            }

            const projectData = `
                - Nombre: ${project?.name}
                - Cliente: ${project?.client}
                - Estado General: ${project?.status}
                - Progreso: ${project?.progress}%
                - Estado de Costo: ${project?.costStatus} (Presupuesto: ${project?.budget}, Gastado: ${project?.spent})
                - Hitos Clave: ${milestones.map(m => `${m.name} (${m.status})`).join(', ')}
                - Riesgos Activos: ${risks.filter(r => r.status === 'Abierto').map(r => `${r.name} (Impacto: ${r.impact}, Probabilidad: ${r.probability})`).join(', ')}
            `;

            const prompt = `Eres un consultor experto en gestión de proyectos creando una presentación ejecutiva concisa para la fecha ${presentationDate}.
            Audiencia Objetivo: ${targetAudience}.
            Idioma: Español.
            
            Usa los datos generales del proyecto y enriquécelos con el contexto del último reporte semanal manual.

            **Datos Generales del Proyecto:**
            ${projectData}

            **Contexto del Reporte Semanal Manual:**
            ${reportContext}

            Basado en TODOS los datos, genera una presentación profesional de 4 a 5 diapositivas. El tono debe ser adaptado a la audiencia.
            - Para 'Cliente', enfócate en el valor, progreso, hitos alcanzados y próximos pasos. Sé positivo pero transparente.
            - Para 'Dirección Interna', enfócate en el estado real (KPIs), salud financiera, riesgos críticos y necesidades del equipo.
            
            Formatea la salida como un objeto JSON que siga el esquema proporcionado. Para el campo "content", usa markdown simple: **texto** para negrita y * para listas de viñetas.`;

             const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    slides: {
                    type: Type.ARRAY,
                    description: 'Un array de diapositivas de presentación.',
                    items: {
                        type: Type.OBJECT,
                        properties: {
                        title: {
                            type: Type.STRING,
                            description: 'El título de la diapositiva.'
                        },
                        content: {
                            type: Type.STRING,
                            description: 'El contenido principal de la diapositiva. Usa markdown: **negrita** y * para viñetas.'
                        },
                        speakerNotes: {
                            type: Type.STRING,
                            description: 'Notas breves para el presentador para esta diapositiva específica.'
                        }
                        },
                        required: ['title', 'content', 'speakerNotes']
                    }
                    }
                },
                required: ['slides']
                };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: responseSchema,
                }
            });

            const result = JSON.parse(response.text);
            setGeneratedSlides(result.slides);

        } catch (err) {
            console.error('Error generating presentation:', err);
            const errorMessage = (err instanceof Error) ? err.message : 'Ocurrió un error desconocido.';
            setPptError(`No se pudo generar la presentación. Error: ${errorMessage}`);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleExportToPptx = () => {
        if (generatedSlides.length === 0) return;

        const pptx = new PptxGenJS();
        const project = PROJECTS.find(p => p.id === selectedProjectIdForPPT);

        pptx.defineLayout({ name: 'A4', width: 11.7, height: 8.3 });
        pptx.layout = 'A4';
        
        // Title Slide
        const titleSlide = pptx.addSlide();
        titleSlide.background = { color: 'F1F5F9' };
        titleSlide.addText(project?.name || 'Presentación del Proyecto', { 
            x: '5%', y: '30%', w: '90%', h: '20%', 
            align: 'center', fontSize: 36, bold: true, color: '0B69A3' 
        });
        titleSlide.addText(`Reporte para: ${targetAudience}`, { 
            x: '5%', y: '50%', w: '90%', h: '10%', 
            align: 'center', fontSize: 20, color: '374151' 
        });

        // Content Slides
        generatedSlides.forEach(s => {
            const slide = pptx.addSlide();
            slide.background = { color: 'FFFFFF' };

            slide.addText(s.title, { 
                x: 0.5, y: 0.4, w: '90%', h: 1, 
                fontSize: 28, bold: true, color: '0052CC'
            });

            const contentLines = s.content.split('\n').filter(line => line.trim() !== '');
            let currentY = 1.5;

            contentLines.forEach(line => {
                const isListItem = line.trim().startsWith('* ');
                const text = isListItem ? line.trim().substring(2) : line.trim();
                
                const textObjects: PptxGenJS.TextProps[] = text.split(/\*\*(.*?)\*\*/g).filter(p => p).map((part) => ({
                    text: part.replace(/\*\*/g, ''),
                    options: { bold: text.includes(`**${part}**`) }
                }));

                if (textObjects.length > 0) {
                     slide.addText(textObjects, { 
                        x: 0.7, y: currentY, w: '85%', h: 0.5, 
                        fontSize: 16, 
                        bullet: isListItem ? { type: 'bullet' } : undefined,
                        color: '374151',
                        lineSpacing: 24,
                    });
                    currentY += (isListItem ? 0.35 : 0.5);
                }
            });

            slide.addNotes(s.speakerNotes);
        });

        pptx.writeFile({ fileName: `Presentacion_${project?.name || 'Proyecto'}_${presentationDate}.pptx` });
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Generación de Reportes</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-fit">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Registrar Reporte Semanal</h2>
                    <form onSubmit={handleAddReport} className="space-y-4">
                        <div>
                            <label htmlFor="project" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Proyecto</label>
                            <select id="project" value={reportProjectId} onChange={e => setReportProjectId(e.target.value)} className={formInputClass} required>
                                <option value="" disabled>Seleccionar proyecto</option>
                                {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="reportDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Fecha del Reporte</label>
                            <input type="date" id="reportDate" value={reportDate} onChange={e => setReportDate(e.target.value)} className={formInputClass} required />
                        </div>
                        <div>
                            <label htmlFor="activities" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Actividades Realizadas</label>
                            <textarea id="activities" value={activitiesDone} onChange={e => setActivitiesDone(e.target.value)} rows={4} className={formTextareaClass} placeholder="Describa las actividades..." required></textarea>
                        </div>
                        <div>
                            <label htmlFor="next-steps" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Próximos Pasos</label>
                            <textarea id="next-steps" value={nextSteps} onChange={e => setNextSteps(e.target.value)} rows={3} className={formTextareaClass} placeholder="Describa los siguientes pasos..." required></textarea>
                        </div>
                         <div>
                            <label htmlFor="new-risks" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Riesgos Nuevos/Actualizados</label>
                            <textarea id="new-risks" value={newRisks} onChange={e => setNewRisks(e.target.value)} rows={2} className={formTextareaClass} placeholder="Describa los riesgos..."></textarea>
                        </div>
                        <button type="submit" className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                            Añadir Reporte al Historial
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Historial de Reportes</h2>
                    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                       {reports.length > 0 ? reports
                        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(report => (
                           <ReportCard key={report.id} report={report} project={PROJECTS.find(p => p.id === report.projectId)} />
                       )) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow-inner">
                            No hay reportes en el historial.
                        </div>
                       )}
                    </div>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                    <PresentationIcon className="h-7 w-7 text-gray-800 dark:text-white" />
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Generador de Presentaciones Ejecutivas</h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-6">La IA creará automáticamente diapositivas con gráficos y textos adaptados para diferentes audiencias.</p>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="md:col-span-1">
                            <label htmlFor="ppt-project" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">1. Selecciona el Proyecto</label>
                            <select id="ppt-project" value={selectedProjectIdForPPT} onChange={e => setSelectedProjectIdForPPT(e.target.value)} className={formInputClass}>
                                {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                         <div className="md:col-span-1">
                            <label htmlFor="presentationDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">2. Fecha de Contexto</label>
                            <input type="date" id="presentationDate" value={presentationDate} onChange={e => setPresentationDate(e.target.value)} className={formInputClass} required />
                        </div>
                         <div className="md:col-span-1">
                            <label htmlFor="ppt-audience" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">3. Elige la Audiencia</label>
                            <select id="ppt-audience" value={targetAudience} onChange={e => setTargetAudience(e.target.value as any)} className={formInputClass}>
                                <option value="Cliente">Cliente</option>
                                <option value="Dirección Interna">Dirección Interna</option>
                            </select>
                        </div>
                        <div className="self-end">
                            <button onClick={handleGeneratePresentation} disabled={isGenerating} className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:bg-blue-400 dark:disabled:bg-blue-800/50 disabled:cursor-wait">
                                {isGenerating ? 'Generando...' : 'Generar Presentación con IA'}
                            </button>
                        </div>
                    </div>

                    {pptError && <div className="text-red-500 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/30 rounded-lg mb-4">{pptError}</div>}

                    <div className="mt-4 bg-gray-100 dark:bg-gray-900/70 p-4 rounded-lg min-h-[450px] flex flex-col justify-center">
                        {isGenerating && <div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div><p>La IA está preparando tu presentación...</p></div>}
                        {!isGenerating && generatedSlides.length === 0 && <div className="text-center text-gray-500">La presentación generada aparecerá aquí.</div>}
                        {generatedSlides.length > 0 && (
                            <div className="w-full">
                                <div className="aspect-[16/9] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 flex flex-col justify-between relative overflow-hidden">
                                   <div>
                                     <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">{generatedSlides[currentSlideIndex].title}</h3>
                                     <div className="text-gray-700 dark:text-gray-200">
                                        <FormattedContent content={generatedSlides[currentSlideIndex].content} />
                                     </div>
                                   </div>
                                   <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Notas del Orador:</p>
                                        <p className="text-sm italic text-gray-600 dark:text-gray-300">{generatedSlides[currentSlideIndex].speakerNotes}</p>
                                   </div>
                                    <div className="absolute bottom-4 right-4 text-xs font-semibold text-gray-400">{currentSlideIndex + 1} / {generatedSlides.length}</div>
                                </div>
                                <div className="flex justify-center items-center mt-4 space-x-4">
                                    <button onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))} disabled={currentSlideIndex === 0} className="p-2 rounded-full bg-white dark:bg-gray-700 shadow disabled:opacity-50"><ChevronLeftIcon className="h-5 w-5"/></button>
                                    <span className="text-sm font-medium">Diapositiva {currentSlideIndex + 1}</span>
                                    <button onClick={() => setCurrentSlideIndex(prev => Math.min(generatedSlides.length - 1, prev + 1))} disabled={currentSlideIndex === generatedSlides.length - 1} className="p-2 rounded-full bg-white dark:bg-gray-700 shadow disabled:opacity-50"><ChevronRightIcon className="h-5 w-5"/></button>
                                    <button onClick={handleExportToPptx} disabled={generatedSlides.length === 0} className="p-2 rounded-full bg-white dark:bg-gray-700 shadow disabled:opacity-50 flex items-center text-blue-600 dark:text-blue-300 disabled:text-gray-400" title="Exportar a PPTX">
                                        <ExportIcon className="h-5 w-5"/>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;