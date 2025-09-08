import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Exercise, Category, Equipment, Muscle } from './types';
import { sanitizeExercises } from './services/fileService';
import ExerciseList from './components/ExerciseList';
import ExerciseFormModal from './components/ExerciseFormModal';
import { PlusIcon, UploadIcon, DownloadIcon } from './components/Icons';
import { CATEGORIES, EQUIPMENT_OPTIONS, MUSCLE_OPTIONS } from './constants';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function App() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingExercise, setEditingExercise] = useState<Exercise | 'new' | null>(null);
  const [fileName, setFileName] = useState<string>('exercises.json');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');


  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<'all' | Equipment>('all');
  const [muscleFilter, setMuscleFilter] = useState<'all' | Muscle>('all');
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);
  
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const deleteTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini-api-key');
    if (storedKey) {
      setApiKey(storedKey);
      setTempApiKey(storedKey);
    }
  }, []);

  const handleApiKeySave = () => {
    setApiKey(tempApiKey);
    localStorage.setItem('gemini-api-key', tempApiKey);
    alert('API Key saved!');
  };


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const content = await file.text();
        const data = JSON.parse(content);
        const sanitizedData = sanitizeExercises(data);
        setExercises(sanitizedData);
        setFileName(file.name);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error reading or parsing file:", error);
        alert("Failed to load file. Make sure it's a valid JSON file.");
      }
    }
  };

  const handleSaveFile = () => {
    const dataStr = JSON.stringify(exercises, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
        const searchTermMatch = searchTerm === '' ||
            ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ex.name_en.toLowerCase().includes(searchTerm.toLowerCase());
        
        const categoryMatch = categoryFilter === 'all' || ex.category === categoryFilter;
        
        const equipmentMatch = equipmentFilter === 'all' || ex.equipment.includes(equipmentFilter);
        
        const muscleMatch = muscleFilter === 'all' || ex.primary_muscles.includes(muscleFilter);

        return searchTermMatch && categoryMatch && equipmentMatch && muscleMatch;
    });
  }, [exercises, searchTerm, categoryFilter, equipmentFilter, muscleFilter]);

  const totalPages = Math.ceil(filteredExercises.length / itemsPerPage);

  const paginatedExercises = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredExercises.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredExercises, currentPage, itemsPerPage]);

  const handleSaveExercise = useCallback((exerciseToSave: Exercise) => {
    setExercises(prev => {
      if (editingExercise === 'new') {
        const newId = prev.length > 0 ? Math.max(...prev.map(e => e.id)) + 1 : 1;
        return [...prev, { ...exerciseToSave, id: newId }];
      } else if (editingExercise && typeof editingExercise === 'object') {
        return prev.map(ex => ex.id === exerciseToSave.id ? exerciseToSave : ex);
      }
      return prev;
    });
    setEditingExercise(null);
  }, [editingExercise]);

  const performDelete = useCallback((id: number) => {
    const newExercises = exercises.filter(ex => ex.id !== id);
    
    const newFilteredExercises = newExercises.filter(ex => {
        const searchTermMatch = searchTerm === '' ||
            ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ex.name_en.toLowerCase().includes(searchTerm.toLowerCase());
        
        const categoryMatch = categoryFilter === 'all' || ex.category === categoryFilter;
        const equipmentMatch = equipmentFilter === 'all' || ex.equipment.includes(equipmentFilter);
        const muscleMatch = muscleFilter === 'all' || ex.primary_muscles.includes(muscleFilter);

        return searchTermMatch && categoryMatch && equipmentMatch && muscleMatch;
    });

    const newTotalPages = Math.ceil(newFilteredExercises.length / itemsPerPage);

    if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages > 0 ? newTotalPages : 1);
    }

    setExercises(newExercises);
  }, [exercises, searchTerm, currentPage, categoryFilter, equipmentFilter, muscleFilter, itemsPerPage]);

  const handleUndoDelete = useCallback(() => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    setPendingDeleteId(null);
  }, []);

  const handleDeleteExercise = useCallback((id: number) => {
    if (deleteTimerRef.current && pendingDeleteId !== null) {
      clearTimeout(deleteTimerRef.current);
      performDelete(pendingDeleteId);
    }

    setPendingDeleteId(id);

    deleteTimerRef.current = window.setTimeout(() => {
      performDelete(id);
      setPendingDeleteId(null);
      deleteTimerRef.current = null;
    }, 5000);
  }, [pendingDeleteId, performDelete]);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current);
      }
    };
  }, []);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<any>>) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setCurrentPage(1);
  };
  
  const filterSelectClass = "w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 capitalize";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-center text-sky-400 mb-2">Exercise Database Manager</h1>
          <p className="text-center text-slate-400">Load, edit, and save your exercise JSON data.</p>
        </header>

        <div className="bg-slate-800 rounded-lg shadow-xl p-6 mb-6">
          <div className="bg-slate-700/50 rounded-md p-4 mb-6 border border-slate-600">
              <h3 className="text-lg font-semibold text-sky-300 mb-2">Gemini API Key</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                  <input
                      type="password"
                      placeholder="Enter your Gemini API Key"
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      className="flex-grow bg-slate-800 border border-slate-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                      onClick={handleApiKeySave}
                      className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
                  >
                      Save Key
                  </button>
              </div>
              {!apiKey && <p className="text-xs text-yellow-400 mt-2">API key is required for translation features.</p>}
          </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                 <select value={categoryFilter} onChange={handleFilterChange(setCategoryFilter)} className={filterSelectClass}>
                    <option value="all">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
                <select value={equipmentFilter} onChange={handleFilterChange(setEquipmentFilter)} className={filterSelectClass}>
                    <option value="all">All Equipment</option>
                    {EQUIPMENT_OPTIONS.map(e => <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>)}
                </select>
                <select value={muscleFilter} onChange={handleFilterChange(setMuscleFilter)} className={filterSelectClass}>
                    <option value="all">All Primary Muscles</option>
                    {MUSCLE_OPTIONS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-stretch sm:items-center sm:justify-end">
                <input type="file" accept=".json" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                    <UploadIcon /> Load JSON
                </button>
                <button onClick={handleSaveFile} disabled={exercises.length === 0} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                    <DownloadIcon /> Save JSON
                </button>
                <button onClick={() => setEditingExercise('new')} className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                    <PlusIcon /> Add Exercise
                </button>
            </div>
        </div>

        {exercises.length > 0 ? (
          <>
            <ExerciseList 
              exercises={paginatedExercises}
              onEdit={(ex) => setEditingExercise(ex)}
              onDelete={handleDeleteExercise}
              onUndoDelete={handleUndoDelete}
              pendingDeleteId={pendingDeleteId}
            />
            {totalPages > 0 && (
              <div className="flex flex-wrap justify-center items-center mt-6 gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Items per page:</span>
                    <select value={itemsPerPage} onChange={handleItemsPerPageChange} className="bg-slate-700 border-slate-600 rounded-md py-1 px-2 text-sm focus:ring-sky-500 focus:border-sky-500">
                        {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
                {totalPages > 1 &&
                  <div className="flex items-center">
                      <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 mx-1 bg-slate-700 rounded-l-md disabled:opacity-50 hover:bg-slate-600">Prev</button>
                      <span className="px-4 py-2 bg-slate-800 text-slate-300">Page {currentPage} of {totalPages}</span>
                      <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 mx-1 bg-slate-700 rounded-r-md disabled:opacity-50 hover:bg-slate-600">Next</button>
                  </div>
                }
              </div>
            )}
             {filteredExercises.length > 0 && paginatedExercises.length === 0 && (
              <div className="text-center py-20 bg-slate-800 rounded-lg shadow-xl">
                <p className="text-xl text-slate-400">No exercises found.</p>
                <p className="text-slate-500 mt-2">Try adjusting your search or filters.</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-slate-800 rounded-lg shadow-xl">
            <p className="text-xl text-slate-400">No exercises loaded.</p>
            <p className="text-slate-500 mt-2">Click "Load JSON" to start.</p>
          </div>
        )}

      </div>
      
      {editingExercise && (
        <ExerciseFormModal
          exercise={editingExercise === 'new' ? null : editingExercise}
          onSave={handleSaveExercise}
          onClose={() => setEditingExercise(null)}
          apiKey={apiKey}
        />
      )}
    </div>
  );
}