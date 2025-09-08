import React, { useState, useEffect, useRef } from 'react';
import { Exercise, Muscle, Equipment } from '../types';
import { CATEGORIES, EQUIPMENT_OPTIONS, MUSCLE_OPTIONS } from '../constants';
import { ImageIcon } from './Icons';
import { translateToPersian, translateAllToPersian, AllTranslations } from '../services/translationService';

interface ExerciseFormModalProps {
  exercise: Exercise | null;
  onSave: (exercise: Exercise) => void;
  onClose: () => void;
  apiKey: string;
}

const defaultExercise: Omit<Exercise, 'id'> = {
  name: '',
  name_en: '',
  category: 'strength',
  equipment: [],
  primary_muscles: [],
  secondary_muscles: [],
  description: '',
  description_fa: '',
  instructions: [''],
  instructions_fa: [''],
  video: '',
  images: [''],
  aliases: [''],
  variation_on: [''],
};

const FormImagePreview: React.FC<{ src: string }> = ({ src }) => {
    const [hasError, setHasError] = useState(!src);

    useEffect(() => {
        setHasError(!src);
    }, [src]);

    if (hasError) {
        return (
            <div className="w-16 h-16 bg-slate-700 flex-shrink-0 rounded-md flex items-center justify-center">
                <ImageIcon />
            </div>
        );
    }
    return (
        <img
            src={src}
            alt="Image preview"
            className="w-16 h-16 object-cover bg-slate-700 flex-shrink-0 rounded-md"
            onError={() => setHasError(true)}
        />
    );
};

// A more advanced and user-friendly multi-select component
const MultiSelectPillInput = <T extends string>({
  title,
  options,
  selectedOptions,
  onToggle,
  placeholder,
}: {
  title: string;
  options: readonly T[];
  selectedOptions: T[];
  onToggle: (option: T) => void;
  placeholder: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter(
    option =>
      !selectedOptions.includes(option) &&
      option.toLowerCase().replace(/_/g, ' ').includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: T) => {
    onToggle(option);
    setSearchTerm('');
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-slate-300 mb-2">{title}</label>
      <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm min-h-[42px]">
        {selectedOptions.map(option => (
          <div key={option} className="flex items-center bg-sky-800 text-sky-200 text-sm font-medium px-2 py-0.5 rounded-full">
            <span className="capitalize">{option.replace(/_/g, ' ')}</span>
            <button
              type="button"
              onClick={() => onToggle(option)}
              className="ml-2 text-sky-300 hover:text-white focus:outline-none"
            >
              &times;
            </button>
          </div>
        ))}
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedOptions.length === 0 ? placeholder : ''}
          className="flex-grow bg-transparent focus:outline-none p-1"
        />
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <div
                key={option}
                onClick={() => handleSelect(option)}
                className="px-4 py-2 text-sm capitalize cursor-pointer hover:bg-slate-600"
              >
                {option.replace(/_/g, ' ')}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-slate-400">No options found</div>
          )}
        </div>
      )}
    </div>
  );
};


const ExerciseFormModal: React.FC<ExerciseFormModalProps> = ({ exercise, onSave, onClose, apiKey }) => {
  const [formData, setFormData] = useState<Omit<Exercise, 'id'>>(() => 
    exercise ? { ...exercise } : defaultExercise
  );
  
  const [isTranslating, setIsTranslating] = useState({
    name: false,
    description: false,
    instructions: false,
  });
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);


  useEffect(() => {
    setFormData(exercise ? { ...exercise } : defaultExercise);
  }, [exercise]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = <T,>(field: keyof Exercise, value: T) => {
    setFormData(prev => {
      const currentValues = (prev[field] as T[]) || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  };

  const handleArrayStringChange = (field: keyof Exercise, index: number, value: string) => {
    setFormData(prev => {
      const currentArray = (prev[field] as string[]) || [];
      const newArray = [...currentArray];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayStringItem = (field: keyof Exercise) => {
    setFormData(prev => {
      const currentArray = (prev[field] as string[]) || [];
      return { ...prev, [field]: [...currentArray, ''] };
    });
  };

  const removeArrayStringItem = (field: keyof Exercise, index: number) => {
    setFormData(prev => {
      const currentArray = (prev[field] as string[]) || [];
      return { ...prev, [field]: currentArray.filter((_, i) => i !== index) };
    });
  };

  const handleMultilineStringToArrayChange = (field: keyof Pick<Exercise, 'instructions' | 'instructions_fa'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.split('\n'),
    }));
  };
  
  const handleTranslate = async (field: 'name' | 'description' | 'instructions') => {
      setIsTranslating(prev => ({ ...prev, [field]: true }));
      try {
          let sourceText = '';
          if (field === 'name') sourceText = formData.name_en;
          else if (field === 'description') sourceText = formData.description;
          else if (field === 'instructions') sourceText = formData.instructions.join('\n');

          if (!sourceText.trim()) return;

          const translatedText = await translateToPersian(sourceText, apiKey);

          setFormData(prev => {
              const newState = { ...prev };
              if (field === 'name') newState.name = translatedText;
              else if (field === 'description') newState.description_fa = translatedText;
              else if (field === 'instructions') newState.instructions_fa = translatedText.split('\n');
              return newState;
          });
      } catch (error) {
          console.error(`Translation failed for ${field}:`, error);
          alert(`Failed to translate ${field}. Check API Key and console for details.`);
      } finally {
          setIsTranslating(prev => ({ ...prev, [field]: false }));
      }
  };

  const handleTranslateAll = async () => {
    setIsTranslatingAll(true);
    try {
        const { name_en, description, instructions } = formData;
        if (!name_en && !description && !instructions.join('')) return;

        const translations: AllTranslations = await translateAllToPersian(name_en, description, instructions, apiKey);

        setFormData(prev => ({
            ...prev,
            name: translations.name || prev.name,
            description_fa: translations.description || prev.description_fa,
            instructions_fa: translations.instructions.split('\n') || prev.instructions_fa,
        }));

    } catch (error) {
        console.error('Translate All failed:', error);
        alert('Failed to translate all fields. Check API Key and console for details.');
    } finally {
        setIsTranslatingAll(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalExercise: Exercise = {
      ...formData,
      id: exercise?.id ?? 0, // ID is handled by App component logic
      instructions: formData.instructions.filter(i => i.trim() !== ''),
      instructions_fa: formData.instructions_fa.filter(i => i.trim() !== ''),
      images: formData.images.filter(i => i.trim() !== ''),
      aliases: formData.aliases.filter(i => i.trim() !== ''),
      variation_on: formData.variation_on.filter(i => i.trim() !== ''),
    };
    onSave(finalExercise);
  };
  
  const renderStringArrayInput = (
    title: string,
    field: keyof Exercise,
    placeholder: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">{title}</label>
      {(formData[field] as string[]).map((item, index) => (
        <div key={index} className="flex items-center gap-2 mb-2">
          {field === 'images' && <FormImagePreview src={item} />}
          <input
            type="text"
            placeholder={placeholder}
            value={item}
            onChange={(e) => handleArrayStringChange(field, index, e.target.value)}
            className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <button
            type="button"
            onClick={() => removeArrayStringItem(field, index)}
            className="text-red-400 hover:text-red-300 p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 flex-shrink-0 leading-none text-xl"
            style={{ width: '30px', height: '30px' }}
            aria-label={`Remove ${title.slice(0, -1)}`}
          >
            &times;
          </button>
        </div>
      ))}
      <button type="button" onClick={() => addArrayStringItem(field)} className="text-sm text-sky-400 hover:text-sky-300 mt-1">
        + Add {title.slice(0, -1)}
      </button>
    </div>
  );
  
  const anyIndividualTranslationRunning = isTranslating.name || isTranslating.description || isTranslating.instructions;

  const TranslateButton = ({ onClick, isLoading, disabled }: { onClick: () => void; isLoading: boolean; disabled: boolean }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled || isLoading || !apiKey || isTranslatingAll}
        className="ml-2 text-xs bg-sky-700 text-sky-200 px-2 py-0.5 rounded-md hover:bg-sky-600 disabled:bg-slate-600 disabled:cursor-not-allowed"
    >
        {isLoading ? 'Translating...' : 'Translate'}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-sky-400">{exercise ? 'Edit Exercise' : 'Add New Exercise'}</h2>
              <button
                type="button"
                onClick={handleTranslateAll}
                disabled={!apiKey || isTranslatingAll || anyIndividualTranslationRunning}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed text-sm"
              >
                {isTranslatingAll ? 'Translating All...' : 'Translate All Fields'}
              </button>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
             <div>
                <label htmlFor="name_en" className="block text-sm font-medium text-slate-300">Name (English)</label>
                <input type="text" name="name_en" id="name_en" value={formData.name_en} onChange={handleChange} required className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500" />
            </div>
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                    Name (Persian)
                    <TranslateButton
                        onClick={() => handleTranslate('name')}
                        isLoading={isTranslating.name}
                        disabled={!formData.name_en}
                    />
                </label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500" />
            </div>
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-300">Category</label>
                <select name="category" id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 capitalize">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="video" className="block text-sm font-medium text-slate-300">Video URL</label>
                <input type="text" name="video" id="video" value={formData.video ?? ''} onChange={handleChange} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-300">Description (English)</label>
                <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={4} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 resize-y"></textarea>
              </div>
              <div>
                <label htmlFor="description_fa" className="block text-sm font-medium text-slate-300">
                  Description (Persian)
                  <TranslateButton
                        onClick={() => handleTranslate('description')}
                        isLoading={isTranslating.description}
                        disabled={!formData.description}
                    />
                </label>
                <textarea name="description_fa" id="description_fa" value={formData.description_fa} onChange={handleChange} rows={4} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 resize-y"></textarea>
              </div>
          </div>

          <div className="space-y-6 mb-4">
            <MultiSelectPillInput<Equipment>
              title="Equipment"
              options={EQUIPMENT_OPTIONS}
              selectedOptions={formData.equipment}
              onToggle={(option) => handleMultiSelectChange('equipment', option)}
              placeholder="Select equipment..."
            />
            <MultiSelectPillInput<Muscle>
              title="Primary Muscles"
              options={MUSCLE_OPTIONS}
              selectedOptions={formData.primary_muscles}
              onToggle={(option) => handleMultiSelectChange('primary_muscles', option)}
              placeholder="Select primary muscles..."
            />
            <MultiSelectPillInput<Muscle>
              title="Secondary Muscles"
              options={MUSCLE_OPTIONS}
              selectedOptions={formData.secondary_muscles}
              onToggle={(option) => handleMultiSelectChange('secondary_muscles', option)}
              placeholder="Select secondary muscles..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div>
                <label htmlFor="instructions" className="block text-sm font-medium text-slate-300 mb-2">Instructions (English)</label>
                <textarea
                    id="instructions"
                    name="instructions"
                    placeholder="Enter each instruction on a new line..."
                    value={(formData.instructions || []).join('\n')}
                    onChange={(e) => handleMultilineStringToArrayChange('instructions', e.target.value)}
                    rows={6}
                    className="block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 resize-y"
                />
            </div>
            <div>
                <label htmlFor="instructions_fa" className="block text-sm font-medium text-slate-300 mb-2">
                  Instructions (Persian)
                  <TranslateButton
                        onClick={() => handleTranslate('instructions')}
                        isLoading={isTranslating.instructions}
                        disabled={!formData.instructions.join('')}
                    />
                </label>
                <textarea
                    id="instructions_fa"
                    name="instructions_fa"
                    placeholder="Enter each instruction on a new line..."
                    value={(formData.instructions_fa || []).join('\n')}
                    onChange={(e) => handleMultilineStringToArrayChange('instructions_fa', e.target.value)}
                    rows={6}
                    className="block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 resize-y"
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderStringArrayInput('Aliases', 'aliases', 'Alias name...')}
              {renderStringArrayInput('Variations On', 'variation_on', 'Variation name...')}
          </div>

          <div className="mt-6">
            {renderStringArrayInput('Images', 'images', 'Image URL...')}
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500">Cancel</button>
            <button type="submit" className="py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExerciseFormModal;