
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PROJECTS, TASKS } from '../constants';
import { Task, TaskStatus, Project } from '../types';
import { IaToolsIcon, AlertTriangleIcon } from './Icons';

const taskStatusConfig: { [key in TaskStatus]: { color: string; label: string; } } = {
    [TaskStatus.NotStarted]: { color: 'bg-gray-400 dark:bg-gray-600', label: 'No Iniciada' },
    [TaskStatus.InProgress]: { color: 'bg-green-500 dark:bg-green-600', label: 'En Progreso' },
    [TaskStatus.AtRisk]: { color: 'bg-yellow-500 dark:bg-yellow-600', label: 'En Riesgo' },
    [TaskStatus.Delayed]: { color: 'bg-red-500 dark:bg-red-600', label: 'Retrasada' },
    [TaskStatus.Completed]: { color: 'bg-blue-600 dark:bg-blue-700', label: 'Completada' },
};

const getDaysDiff = (startDate: Date, endDate: Date): number => {
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
};

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};


const Gantt: React.FC = () => {
    const [selectedProjectId, setSelectedProjectId] = useState<string>(PROJECTS[0].id);
    const [allTasks, setAllTasks] = useState<Task[]>(TASKS);
    const [viewMode, setViewMode] = useState<'Month' | 'Week'>('Month');
    const ganttContainerRef = useRef<HTMLDivElement>(null);
    const taskRowRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});


    const projectTasks = useMemo(() => {
        // Simple critical path calculation
        const tasks = allTasks.filter(t => t.projectId === selectedProjectId);
        const taskMap = new Map(tasks.map(t => [t.id, t]));
        
        // Build adjacency list for successors
        const successors = new Map<string, string[]>();
        tasks.forEach(t => t.dependencies.forEach(depId => {
            if (!successors.has(depId)) successors.set(depId, []);
            successors.get(depId)!.push(t.id);
        }));

        // Find end tasks
        const endTasks = tasks.filter(t => !successors.has(t.id) || successors.get(t.id)?.length === 0);
        
        // This is a simplified simulation of critical path. A real one needs graph traversal.
        // For this demo, let's trace back from the last task.
        const criticalPathIds = new Set<string>();
        if(endTasks.length > 0) {
            const lastTask = endTasks.sort((a,b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
            let currentUserTask: Task | undefined = lastTask;
            while(currentUserTask) {
                criticalPathIds.add(currentUserTask.id);
                if (currentUserTask.dependencies.length > 0) {
                    const nextDep = currentUserTask.dependencies[0];
                    currentUserTask = taskMap.get(nextDep);
                } else {
                    currentUserTask = undefined;
                }
            }
        }
        
        return tasks.map(t => ({...t, isCritical: criticalPathIds.has(t.id)}));
    }, [selectedProjectId, allTasks]);

    const { timelineStart, timelineEnd } = useMemo(() => {
        if (projectTasks.length === 0) {
            const now = new Date();
            return { timelineStart: new Date(now.getFullYear(), now.getMonth(), 1), timelineEnd: addDays(now, 60) };
        }
        const startDates = projectTasks.map(t => new Date(t.startDate));
        const endDates = projectTasks.map(t => new Date(t.endDate));
        const minDate = new Date(Math.min(...startDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...endDates.map(d => d.getTime())));
        return { timelineStart: addDays(minDate, -7), timelineEnd: addDays(maxDate, 7) };
    }, [projectTasks]);

    const timelineHeaders = useMemo(() => {
        const headers = [];
        let current = new Date(timelineStart);
        while (current <= timelineEnd) {
            if (viewMode === 'Month') {
                const month = current.toLocaleString('es-ES', { month: 'long' });
                const year = current.getFullYear();
                const monthKey = `${month}-${year}`;
                const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
                if (!headers.find(h => h.key === monthKey)) {
                    headers.push({ key: monthKey, label: `${month} '${String(year).slice(-2)}`, span: daysInMonth });
                }
                current.setMonth(current.getMonth() + 1);
                current.setDate(1);
            } else { // Week
                 headers.push({ key: `W${current.getTime()}`, label: `S${headers.length + 1}`, span: 7 });
                 current = addDays(current, 7);
            }
        }
        return headers;
    }, [timelineStart, timelineEnd, viewMode]);

    const totalTimelineDays = getDaysDiff(timelineStart, timelineEnd);
    const formInputClass = "bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";
    
    return (
        <div className="p-8">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                 <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className={formInputClass}
                        >
                            {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                         <div className="flex items-center rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                            {['Month', 'Week'].map(mode => (
                                <button key={mode} onClick={() => setViewMode(mode as 'Month' | 'Week')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === mode ? 'bg-white dark:bg-gray-800 shadow text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}>
                                    {mode === 'Month' ? 'Mes' : 'Semana'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <button className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors">
                            <IaToolsIcon className="h-4 w-4" />
                            <span>Reprogramar con IA</span>
                        </button>
                        <button className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                           Exportar
                        </button>
                    </div>
                </div>
            </div>

            <div ref={ganttContainerRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                 <div className="gantt-grid" style={{ minWidth: `${totalTimelineDays * (viewMode === 'Month' ? 30 : 50)}px`}}>
                    <div 
                        className="sticky left-0 z-10 grid" 
                        style={{
                            gridTemplateRows: `4rem repeat(${projectTasks.length}, 3.5rem)`,
                            width: '280px',
                            minWidth: '280px'
                        }}
                    >
                         {/* Header Izquierdo */}
                        <div className="border-r border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center p-2">
                             <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Tareas</h3>
                        </div>
                         {/* Lista de Tareas */}
                        {projectTasks.map((task, index) => (
                             <div key={task.id} className="border-r border-b border-gray-200 dark:border-gray-700 flex items-center p-3 text-sm"
                                 style={{ gridRow: `${index + 2} / span 1` }} >
                                <div className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${taskStatusConfig[task.status].color}`}></span>
                                    <span className="truncate font-medium text-gray-700 dark:text-gray-200">{task.name}</span>
                                    {task.isCritical && task.status === TaskStatus.Delayed && <AlertTriangleIcon className="h-4 w-4 ml-1 text-red-500" title="Tarea crítica retrasada"/>}
                                </div>
                             </div>
                        ))}
                    </div>

                    <div className="relative" style={{ gridColumn: '2 / 3', gridRow: '1 / -1'}}>
                        <div className="grid" style={{ gridTemplateRows: `4rem repeat(${projectTasks.length}, 3.5rem)`}}>
                             {/* Header de la línea de tiempo */}
                            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50" style={{ gridRow: '1 / 2' }}>
                                 {timelineHeaders.map(header => (
                                     <div key={header.key} className="flex-grow flex-shrink-0 text-center font-semibold text-xs text-gray-500 dark:text-gray-400 p-2 border-r border-gray-200 dark:border-gray-700" style={{ width: `${header.span * (totalTimelineDays / timelineHeaders.reduce((a,b) => a+b.span, 0))}px` }}>
                                         {header.label}
                                     </div>
                                 ))}
                            </div>
                            {/* Filas de la cuadrícula y barras */}
                            {projectTasks.map((task, index) => {
                                 const taskStart = new Date(task.startDate);
                                 const taskEnd = new Date(task.endDate);
                                 const startOffset = getDaysDiff(timelineStart, taskStart);
                                 const duration = getDaysDiff(taskStart, taskEnd) + 1;

                                return (
                                <div key={task.id} ref={el => { taskRowRefs.current[task.id] = el; }} className="relative border-b border-gray-200 dark:border-gray-700" style={{ gridRow: `${index + 2} / span 1` }}>
                                     <div title={`${task.name}\n${task.startDate} - ${task.endDate}`}
                                        className={`absolute my-2.5 rounded-md h-8 flex items-center px-2 text-white text-xs font-bold shadow-sm transition-all duration-300 ${taskStatusConfig[task.status].color} ${task.isCritical ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-red-500' : ''}`}
                                        style={{
                                            left: `${(startOffset / totalTimelineDays) * 100}%`,
                                            width: `${(duration / totalTimelineDays) * 100}%`,
                                        }}
                                    >
                                        <span className="truncate">{task.name}</span>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                        {/* SVG para las dependencias */}
                        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ gridRow: '1 / -1' }}>
                             {projectTasks.map((task, index) => {
                                 if (!task.dependencies) return null;
                                 return task.dependencies.map(depId => {
                                     const predecessor = projectTasks.find(t => t.id === depId);
                                     if (!predecessor) return null;
                                     const predIndex = projectTasks.findIndex(t => t.id === depId);
                                     
                                     const rowHeight = 56; // 3.5rem
                                     const headerHeight = 64; // 4rem
                                     const barHeight = 32; // h-8

                                     const predEndOffset = getDaysDiff(timelineStart, new Date(predecessor.endDate));
                                     const taskStartOffset = getDaysDiff(timelineStart, new Date(task.startDate));

                                     const startX = (predEndOffset / totalTimelineDays) * ganttContainerRef.current?.querySelector('.relative')?.clientWidth!;
                                     const startY = headerHeight + (predIndex * rowHeight) + (rowHeight / 2);
                                     const endX = (taskStartOffset / totalTimelineDays) * ganttContainerRef.current?.querySelector('.relative')?.clientWidth!;
                                     const endY = headerHeight + (index * rowHeight) + (rowHeight / 2);
                                     
                                     if(isNaN(startX) || isNaN(startY) || isNaN(endX) || isNaN(endY)) return null;

                                     return (
                                        <path key={`${depId}-${task.id}`} d={`M ${startX} ${startY} L ${startX + 10} ${startY} L ${startX + 10} ${endY} L ${endX} ${endY}`} stroke="#9ca3af" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                                     );
                                 });
                             })}
                            <defs>
                                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
                                </marker>
                            </defs>
                        </svg>
                    </div>
                </div>
            </div>
            <style>{`
                .gantt-grid {
                    display: grid;
                    grid-template-columns: min-content 1fr;
                }
            `}</style>
        </div>
    );
};

export default Gantt;