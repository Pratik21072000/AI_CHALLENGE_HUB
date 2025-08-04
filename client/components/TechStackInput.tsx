import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

const defaultTechOptions = [
  'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'C#', '.NET',
  'JavaScript', 'TypeScript', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'MongoDB', 'PostgreSQL', 'MySQL',
  'Redis', 'GraphQL', 'REST API', 'Microservices', 'Machine Learning', 'AI',
  'Blockchain', 'IoT', 'AR/VR', 'Mobile', 'Web3', 'TensorFlow', 'PyTorch'
];

interface TechStackInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export default function TechStackInput({ value, onChange, placeholder = "Type technology or skill..." }: TechStackInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [techOptions, setTechOptions] = useState(defaultTechOptions);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on input value
  const filteredOptions = techOptions.filter(tech => 
    tech.toLowerCase().includes(inputValue.toLowerCase()) && 
    !value.includes(tech)
  );

  // Handle adding a tech
  const addTech = (tech: string) => {
    if (tech && !value.includes(tech)) {
      onChange([...value, tech]);
      
      // Add to options if it's new
      if (!techOptions.includes(tech)) {
        setTechOptions(prev => [...prev, tech].sort());
      }
    }
    setInputValue('');
    setShowDropdown(false);
  };

  // Handle removing a tech
  const removeTech = (techToRemove: string) => {
    onChange(value.filter(tech => tech !== techToRemove));
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowDropdown(newValue.length > 0);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        if (filteredOptions.length > 0) {
          addTech(filteredOptions[0]);
        } else {
          addTech(inputValue.trim());
        }
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setInputValue('');
    }
  };

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3">
      {/* Selected Tech Stack */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tech) => (
            <Badge key={tech} variant="secondary" className="text-sm">
              {tech}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeTech(tech)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input with Dropdown */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              onFocus={() => inputValue.length > 0 && setShowDropdown(true)}
              placeholder={placeholder}
              className="pr-10"
            />
            {inputValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => {
                  if (inputValue.trim()) {
                    if (filteredOptions.length > 0) {
                      addTech(filteredOptions[0]);
                    } else {
                      addTech(inputValue.trim());
                    }
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Dropdown */}
        {showDropdown && (filteredOptions.length > 0 || inputValue.trim()) && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredOptions.length > 0 ? (
              <>
                {filteredOptions.slice(0, 10).map((tech) => (
                  <div
                    key={tech}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => addTech(tech)}
                  >
                    {tech}
                  </div>
                ))}
                {filteredOptions.length > 10 && (
                  <div className="px-3 py-2 text-xs text-gray-500 border-t">
                    +{filteredOptions.length - 10} more options...
                  </div>
                )}
              </>
            ) : (
              inputValue.trim() && (
                <div
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-t"
                  onClick={() => addTech(inputValue.trim())}
                >
                  <div className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Add "{inputValue.trim()}"
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Type to search existing technologies or add new ones. Press Enter to add.
      </p>
    </div>
  );
}
