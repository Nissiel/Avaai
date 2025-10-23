declare module '@monaco-editor/react' {
  import * as React from 'react';

  export interface MonacoEditorProps {
    height?: string | number;
    width?: string | number;
    value?: string;
    defaultValue?: string;
    language?: string;
    theme?: string;
    options?: Record<string, unknown>;
    onChange?: (value: string | undefined) => void;
  }

  const MonacoEditor: React.FC<MonacoEditorProps>;
  export default MonacoEditor;
}

declare module '@dnd-kit/core' {
  export const DndContext: React.FC<any>;
  export const closestCenter: any;
  export const PointerSensor: any;
  export const KeyboardSensor: any;
  export const useSensors: (...args: any[]) => any;
  export const useSensor: (sensor: any, options?: any) => any;
}

declare module '@dnd-kit/sortable' {
  export const SortableContext: React.FC<any>;
  export const useSortable: (args: any) => any;
  export const sortableKeyboardCoordinates: any;
  export const arrayMove: <T>(array: T[], oldIndex: number, newIndex: number) => T[];
  export const verticalListSortingStrategy: any;
}

declare module '@dnd-kit/utilities' {
  export const CSS: any;
}
