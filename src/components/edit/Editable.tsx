import { useEffect, useRef, memo } from 'react';
import { useEdit } from './EditContext';

interface EditableProps {
  path: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'div' | 'button' | 'a';
  className?: string;
  children: React.ReactNode;
}

export const Editable = memo(function Editable({ path, as: Tag = 'span', className = '', children }: EditableProps) {
  const { isEditing, registerChange } = useEdit();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isEditing) {
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('data-editing', 'true');
      const onBlur = () => {
        const val = (el.textContent || '').trim();
        registerChange(path, val);
        el.setAttribute('data-dirty', 'true');
      };
      const onKeyDown = (e: KeyboardEvent) => {
        e.stopPropagation();
      };
      el.addEventListener('blur', onBlur);
      el.addEventListener('keydown', onKeyDown);
      return () => {
        el.removeEventListener('blur', onBlur);
        el.removeEventListener('keydown', onKeyDown);
        el.removeAttribute('contenteditable');
        el.removeAttribute('data-editing');
        el.removeAttribute('data-dirty');
      };
    }
  }, [isEditing, path, registerChange]);

  return (
    <Tag ref={ref as any} className={className} data-path={path} suppressContentEditableWarning>
      {children}
    </Tag>
  );
});
