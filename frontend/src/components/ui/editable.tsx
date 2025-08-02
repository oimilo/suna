import { useEffect, useState } from "react";
import { Textarea } from "./textarea";
import { Input } from "./input";
import { Button } from "../home/ui/button";
import { cn, truncateString } from "@/lib/utils";
import { Edit2 } from "lucide-react";

interface EditableTextProps {
    value: string;
    onSave: (value: string) => void;
    className?: string;
    placeholder?: string;
    multiline?: boolean;
    minHeight?: string;
    disabled?: boolean;
  }
  
export const EditableText: React.FC<EditableTextProps> = ({ 
    value, 
    onSave, 
    className = '', 
    placeholder = 'Click to edit...', 
    multiline = false,
    minHeight = 'auto',
    disabled = false
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
  
    useEffect(() => {
      setEditValue(value);
    }, [value]);
  
    const handleSave = () => {
      onSave(editValue);
      setIsEditing(false);
    };
  
    const handleCancel = () => {
      setEditValue(value);
      setIsEditing(false);
    };
  
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !multiline) {
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === 'Enter' && e.metaKey && multiline) {
        handleSave();
      }
    };
  
    if (isEditing) {
      const InputComponent = multiline ? Textarea : Input;
      return (
        <div className="space-y-2">
          <InputComponent
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            autoFocus
            className={cn(
              'text-sm border-none shadow-none px-0 focus-visible:ring-0 bg-transparent',
              multiline ? 'resize-none' : '',
              multiline && minHeight ? `min-h-[${minHeight}]` : '',
              className
            )}
            style={{
              fontSize: 'inherit',
              fontWeight: 'inherit',
              lineHeight: 'inherit',
              ...(multiline && minHeight ? { minHeight } : {})
            }}
            disabled={disabled}
          />
        </div>
      );
    }
  
    return (
      <div 
        className={cn(
          'group bg-transparent cursor-pointer inline-flex items-center gap-1',
          className
        )}
        onClick={() => setIsEditing(true)}
      >
        <span className={cn(
          value ? '' : 'text-muted-foreground italic',
          multiline && minHeight ? `min-h-[${minHeight}]` : ''
        )} style={multiline && minHeight ? { minHeight } : {}}>
          {truncateString(value, 50) || placeholder}
        </span>
        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      </div>
    );
  };