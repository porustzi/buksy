import { useEffect, useRef } from 'react';
import { useEdit } from './EditContext';

interface EditableProps {
  path: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'div' | 'button' | 'a';
  className?: string;
  children: React.ReactNode;
}

export function Editable({ path, as: Tag = 'span', className = '', children }: EditableProps) {
  const { isEditing, registerChange } = useEdit();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!isEditing) return;
    const onBlur = () => {
      registerChange(path, (el.textContent || '').trim());
      el.setAttribute('data-dirty', 'true');
    };
    el.addEventListener('blur', onBlur);
    el.addEventListener('input', () => el.setAttribute('data-dirty', 'true'));
    return () => {
      el.removeEventListener('blur', onBlur);
    };
  }, [isEditing, path, registerChange]);

  return (
    <Tag
      ref={ref as never}
      className={`${className}${isEditing ? ' buksy-editable' : ''}`}
      contentEditable={isEditing}
      suppressContentEditableWarning={!isEditing}
      data-path={path}
    >
      {children}
    </Tag>
  );
}
