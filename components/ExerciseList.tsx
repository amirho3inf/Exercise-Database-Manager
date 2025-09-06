import React, { useState, useEffect } from 'react';
import { Exercise } from '../types';
import { EditIcon, TrashIcon, ImageIcon } from './Icons';

interface ExerciseListProps {
  exercises: Exercise[];
  onEdit: (exercise: Exercise) => void;
  onDelete: (id: number) => void;
  onUndoDelete: () => void;
  pendingDeleteId: number | null;
}

const ImageWithFallback: React.FC<{src?: string, alt: string, className: string}> = ({ src, alt, className }) => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [src]);

    if (!src || hasError) {
        return (
            <div className={`${className.replace('object-cover', '')} bg-slate-700 flex items-center justify-center`}>
                <ImageIcon />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setHasError(true)}
            loading="lazy"
        />
    );
};

const ExerciseList: React.FC<ExerciseListProps> = ({ exercises, onEdit, onDelete, onUndoDelete, pendingDeleteId }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let intervalId: number | undefined;
    if (pendingDeleteId !== null) {
      setCountdown(5);
      intervalId = window.setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pendingDeleteId]);

  return (
    <div className="md:bg-slate-800 md:rounded-lg md:shadow-xl">
      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {exercises.map(exercise => {
          const isPendingDelete = exercise.id === pendingDeleteId;
          return (
            <div key={exercise.id} className={`bg-slate-800 rounded-lg shadow-xl overflow-hidden transition-colors ${isPendingDelete ? 'bg-red-900/40' : ''}`}>
              <ImageWithFallback src={exercise.images?.[0]} alt={exercise.name_en} className="w-full h-40 object-cover" />
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-grow pr-4">
                    <h3 className="font-bold text-lg text-white">{exercise.name_en}</h3>
                    <p className="text-slate-400 text-sm">{exercise.name}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 -mr-2 -mt-2">
                    {isPendingDelete ? (
                      <button
                        onClick={onUndoDelete}
                        className="px-3 py-2 text-sm bg-yellow-500 text-yellow-900 font-bold rounded-md hover:bg-yellow-400 transition-colors"
                        aria-label="Undo delete"
                      >
                        Undo ({countdown}s)
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onEdit(exercise)}
                          className="p-2 text-blue-400 hover:text-blue-300 rounded-full hover:bg-slate-700"
                          aria-label="Edit exercise"
                          disabled={pendingDeleteId !== null}
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => onDelete(exercise.id)}
                          className="p-2 text-red-400 hover:text-red-300 rounded-full hover:bg-slate-700"
                          aria-label="Delete exercise"
                          disabled={pendingDeleteId !== null}
                        >
                          <TrashIcon />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                  <div>
                    <span className="text-xs uppercase text-sky-400 font-semibold">Category</span>
                    <p className="capitalize text-slate-300">{exercise.category.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-sky-400 font-semibold">Primary Muscles</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {exercise.primary_muscles.length > 0 ? (
                        <>
                          {exercise.primary_muscles.slice(0, 4).map(muscle => (
                            <span key={muscle} className="bg-sky-900 text-sky-300 text-xs font-medium px-2 py-0.5 rounded capitalize">
                              {muscle.replace('_', ' ')}
                            </span>
                          ))}
                          {exercise.primary_muscles.length > 4 && (
                            <span className="bg-slate-600 text-slate-300 text-xs font-medium px-2 py-0.5 rounded">
                              +{exercise.primary_muscles.length - 4} more
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400 text-sm italic">N/A</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop Table View */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-sky-300 uppercase bg-slate-700">
            <tr>
              <th scope="col" className="px-4 py-3">Image</th>
              <th scope="col" className="px-6 py-3">Name (English)</th>
              <th scope="col" className="px-6 py-3">Name (Persian)</th>
              <th scope="col" className="px-6 py-3">Category</th>
              <th scope="col" className="px-6 py-3">Primary Muscles</th>
              <th scope="col" className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exercises.map(exercise => {
              const isPendingDelete = exercise.id === pendingDeleteId;
              return (
                <tr key={exercise.id} className={`border-b border-slate-700 transition-colors ${isPendingDelete ? 'bg-red-900/40' : 'hover:bg-slate-700/50'}`}>
                  <td className="px-4 py-4">
                    <ImageWithFallback src={exercise.images?.[0]} alt={exercise.name_en} className="w-24 h-16 object-cover rounded-md" />
                  </td>
                  <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{exercise.name_en}</th>
                  <td className="px-6 py-4 whitespace-nowrap">{exercise.name}</td>
                  <td className="px-6 py-4 capitalize">{exercise.category.replace('_', ' ')}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {exercise.primary_muscles.slice(0, 3).map(muscle => (
                        <span key={muscle} className="bg-sky-900 text-sky-300 text-xs font-medium px-2 py-0.5 rounded capitalize">
                          {muscle.replace('_', ' ')}
                        </span>
                      ))}
                      {exercise.primary_muscles.length > 3 && (
                        <span className="bg-slate-600 text-slate-300 text-xs font-medium px-2 py-0.5 rounded">
                          +{exercise.primary_muscles.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isPendingDelete ? (
                        <div className="flex justify-end">
                          <button
                            onClick={onUndoDelete}
                            className="px-3 py-1.5 text-sm bg-yellow-500 text-yellow-900 font-bold rounded-md hover:bg-yellow-400 transition-colors"
                            aria-label="Undo delete"
                          >
                            Undo ({countdown}s)
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-4">
                          <button onClick={() => onEdit(exercise)} className="text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={pendingDeleteId !== null}>
                            <EditIcon />
                          </button>
                          <button onClick={() => onDelete(exercise.id)} className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={pendingDeleteId !== null}>
                            <TrashIcon />
                          </button>
                        </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExerciseList;
